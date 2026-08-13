import acquireStabilizedSortableScopeLocks from '../../decorators/field/sortable/helpers/acquireStabilizedSortableScopeLocks.js'
import { clearSortableSaveState } from '../../decorators/field/sortable/helpers/clearCachedSortableValues.js'
import performSortablePositionWork from '../../decorators/field/sortable/helpers/performSortablePositionWork.js'
import prepareSortableFieldsForSave from '../../decorators/field/sortable/helpers/prepareSortableFieldsForSave.js'
import { cacheSortableSnapshots } from '../../decorators/field/sortable/helpers/sortableSnapshot.js'
import { SortableFieldConfig } from '../../decorators/field/sortable/Sortable.js'
import Dream from '../../Dream.js'
import ValidationError from '../../errors/ValidationError.js'
import sqlAttributes from '../../helpers/sqlAttributes.js'
import { DateTime } from '../../utils/datetime/DateTime.js'
import DreamTransaction from '../DreamTransaction.js'
import Query from '../Query.js'
import filterRowToKnownColumns from './filterRowToKnownColumns.js'
import runHooksFor from './runHooksFor.js'

export default async function saveDream<DreamInstance extends Dream>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null,
  { skipHooks = false }: { skipHooks?: boolean } = {}
): Promise<DreamInstance> {
  const alreadyPersisted = dream.isPersisted

  if (!skipHooks) {
    if (alreadyPersisted) await runHooksFor('beforeUpdate', dream, alreadyPersisted, null, txn)
    else await runHooksFor('beforeCreate', dream, alreadyPersisted, null, txn)
    await runHooksFor('beforeSave', dream, alreadyPersisted, null, txn)
  }

  // Where this save opens a transaction of its own (below), a failure inside it
  // rolls the driver write back, so the instance has to be able to go back to
  // what it was when `save` was called: an instance left holding the primary
  // key of a rolled-back INSERT — and left clean, so that the retry the failure
  // invites returns at the `isDirty` check below without writing anything — is
  // a record whose row does not exist. Captured before the sortable phase
  // applies its position sentinel, so the retry sees the caller's own position.
  // Only a model declaring sortable fields can reach that transaction, so a save
  // of any other model copies nothing.
  const preSaveState =
    txn || !(dream.constructor as typeof Dream)['sortableFields'].length
      ? null
      : capturePersistenceState(dream)

  // Sortable computes each record's position under an advisory lock on its sort
  // scope, and that lock is transaction-scoped, so the write and the position
  // write that follows it have to commit together. Preparation runs here as a
  // called phase — after every consumer before-hook, never as a hook among
  // them — so that a position or scope change a user's own `beforeSave` hook
  // introduced is inside the boundary regardless of where the hook was
  // registered. Seated before the change capture, so the position sentinel
  // lands in `beforeSaveChanges` exactly as it always has.
  const sortableFieldConfigs = prepareSortableFieldsForSave(dream, { alreadyPersisted, skipHooks })

  const beforeSaveChanges = dream.changes()

  // need to check validations after running before hooks, or else
  // model hooks that might make a model valid cannot run
  if (dream.isInvalid) throw new ValidationError(dream['sanitizedConstructorName'], dream.errors)

  if (alreadyPersisted && !dream.isDirty) return dream

  if (sortableFieldConfigs.length && !txn) {
    // The self-opened transaction holds only Dream's own work: the scope
    // locks, the driver write, and the position write, which is its last
    // statement. COMMIT releases the scope locks before any user after-hook
    // runs; the after-hook and `*Commit` families then run with no
    // transaction, exactly as on a save of a non-sortable model, so a hook
    // that throws cannot roll back the committed row and a slow hook blocks
    // no other writer of the scope.
    try {
      await (dream.constructor as typeof Dream).transaction(
        async sortableTxn => await writeDream(dream, sortableTxn, { alreadyPersisted, sortableFieldConfigs })
      )
    } catch (error) {
      restorePersistenceState(dream, preSaveState!)
      clearSortableSaveState(dream, sortableFieldConfigs)
      throw error
    }

    await runAfterSaveHooks(dream, null, { skipHooks, alreadyPersisted, beforeSaveChanges })
    return dream
  }

  await writeDream(dream, txn, { alreadyPersisted, sortableFieldConfigs })
  await runAfterSaveHooks(dream, txn, { skipHooks, alreadyPersisted, beforeSaveChanges })
  return dream
}

interface PersistenceState {
  isPersisted: boolean
  frozenAttributes: Record<string, any>
  originalAttributes: Record<string, any>
  attributesFromBeforeLastSave: Record<string, any>
  currentAttributes: Record<string, any>
}

/**
 * Everything a write changes about how the instance answers "am I saved, and
 * what has changed since?" — the persisted flag, the attributes the driver's
 * `RETURNING` wrote (the primary key among them), and the three attribute
 * snapshots the dirty-checking reads.
 */
function capturePersistenceState(dream: Dream): PersistenceState {
  return {
    isPersisted: dream.isPersisted,
    frozenAttributes: { ...dream['frozenAttributes'] },
    originalAttributes: { ...dream['originalAttributes'] },
    attributesFromBeforeLastSave: { ...dream['attributesFromBeforeLastSave'] },
    currentAttributes: { ...dream['currentAttributes'] },
  }
}

function restorePersistenceState(dream: Dream, state: PersistenceState) {
  dream['isPersisted'] = state.isPersisted
  dream['frozenAttributes'] = state.frozenAttributes
  dream['originalAttributes'] = state.originalAttributes
  dream['attributesFromBeforeLastSave'] = state.attributesFromBeforeLastSave
  dream['currentAttributes'] = state.currentAttributes
}

async function writeDream<DreamInstance extends Dream>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null,
  {
    alreadyPersisted,
    sortableFieldConfigs,
  }: {
    alreadyPersisted: boolean
    sortableFieldConfigs: SortableFieldConfig[]
  }
): Promise<DreamInstance> {
  let rowFoundBeforeWrite = true

  // A position- or scope-changing update takes its scope locks here, before the
  // write, because the write overwrites the scope column: after it, neither the
  // scope the record is moving out of nor its real position is readable from the
  // row. The locks are therefore held across the update and the position write
  // that follows it — one transaction, one acquisition — and the snapshot the
  // position work is computed from is read here, under them.
  //
  // A create locks later, around its own position computation: it has no scope
  // to move out of and no prior row to snapshot, and the deferrable unique
  // constraint sortable tables carry tolerates two uncommitted rows at the
  // pre-write position sentinel.
  if (txn && alreadyPersisted && sortableFieldConfigs.length) {
    const { rowExists, snapshots } = await acquireStabilizedSortableScopeLocks(
      dream,
      txn,
      sortableFieldConfigs
    )
    rowFoundBeforeWrite = rowExists
    cacheSortableSnapshots(dream, snapshots)
  }

  const now = DateTime.now()
  if (!alreadyPersisted && !(dream as any).createdAt && dream.columns().has('createdAt'))
    (dream as any).createdAt = now
  if (!(dream.dirtyAttributes() as any).updatedAt && dream.columns().has('updatedAt'))
    (dream as any).updatedAt = now

  const hasUnsavedData = !!Object.keys(sqlAttributes(dream)).length

  // BeforeSave/Update actions may clear all the data that we intended to save, leaving us with
  // an invalid update command. The Sortable decorator is an example of this.
  if (!alreadyPersisted || hasUnsavedData) {
    const data = await Query.dbDriverClass(dream.connectionName || 'default').saveDream(dream, txn)

    dream['isPersisted'] = true
    // the row returned by the driver comes from `RETURNING *` (or a
    // `select *` reload on drivers without RETURNING support), so under
    // schema/image skew it can contain columns this build's compiled
    // schema doesn't know about; those must never reach setAttributes
    dream.setAttributes(filterRowToKnownColumns(data, dream.columns() as Set<string>) as any)
  }

  // set frozen attributes to what has already been saved
  dream['freezeAttributes']()
  dream['attributesFromBeforeLastSave'] = dream['originalAttributes']
  dream['originalAttributes'] = dream.getAttributes()

  // An update whose row the snapshot read positively found gone holds no
  // position to move: the vacancy it remembers was closed by whoever removed
  // the row, and shifting the scope from the instance's remembered position
  // would move survivors onto occupied ones. The cached values and the empty
  // snapshot go with it, so a later save of this instance reads the row itself.
  if (txn && sortableFieldConfigs.length) {
    if (rowFoundBeforeWrite)
      await performSortablePositionWork(dream, txn, sortableFieldConfigs, { alreadyPersisted })
    else clearSortableSaveState(dream, sortableFieldConfigs)
  }

  return dream
}

async function runAfterSaveHooks(
  dream: Dream,
  txn: DreamTransaction<Dream> | null,
  {
    skipHooks,
    alreadyPersisted,
    beforeSaveChanges,
  }: {
    skipHooks: boolean
    alreadyPersisted: boolean
    beforeSaveChanges: Partial<Record<string, { was: any; now: any }>> | null
  }
): Promise<void> {
  if (skipHooks) return

  await runHooksFor('afterSave', dream, alreadyPersisted, beforeSaveChanges, txn)
  if (alreadyPersisted) await runHooksFor('afterUpdate', dream, alreadyPersisted, beforeSaveChanges, txn)
  else await runHooksFor('afterCreate', dream, alreadyPersisted, beforeSaveChanges, txn)

  await runHooksFor(
    alreadyPersisted ? 'afterUpdateCommit' : 'afterCreateCommit',
    dream,
    alreadyPersisted,
    beforeSaveChanges,
    txn
  )

  await runHooksFor('afterSaveCommit', dream, alreadyPersisted, beforeSaveChanges, txn)
}
