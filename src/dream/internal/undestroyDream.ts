import { SelectQueryBuilder, UpdateQueryBuilder, UpdateResult } from 'kysely'
import { SOFT_DELETE_SCOPE_NAME } from '../../decorators/class/SoftDelete.js'
import acquireStabilizedSortableScopeLocks from '../../decorators/field/sortable/helpers/acquireStabilizedSortableScopeLocks.js'
import filterQueryToScopeValues from '../../decorators/field/sortable/helpers/filterQueryToScopeValues.js'
import {
  consumeSortableCascadeEdge,
  markSortableCascadeEdge,
  SortableCascadeEdge,
} from '../../decorators/field/sortable/helpers/sortableCascadeEdge.js'
import {
  readSortableSnapshots,
  snapshotScopeValue,
} from '../../decorators/field/sortable/helpers/sortableSnapshot.js'
import { SortableFieldConfig } from '../../decorators/field/sortable/Sortable.js'
import Dream from '../../Dream.js'
import DreamTransaction from '../DreamTransaction.js'
import associationUpdateQuery from './associations/associationUpdateQuery.js'
import { DestroyOptions as OptionalDestroyOptions } from './destroyOptions.js'
import runHooksFor from './runHooksFor.js'
import withConcurrentWriterRetry from './withConcurrentWriterRetry.js'

type UndestroyOptions<DreamInstance extends Dream> = Required<OptionalDestroyOptions<DreamInstance>>

/**
 * @internal
 *
 * Undestroys the Dream and any `dependent: 'destroy'` associations
 * within a transaction. If a transaction is passed, it will be used.
 * Otherwise, a new transaction will be created automatically, and the
 * whole undestroy is run again if that transaction is undone by a
 * concurrent writer (see `withConcurrentWriterRetry`).
 * If any of the nested associations fails to undestroy, then this
 * record will also fail to undestroy. If skipHooks is true, model hooks
 * will be bypassed.
 */
export default async function undestroyDream<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I> | null = null,
  options: UndestroyOptions<I>
): Promise<I> {
  if (txn) {
    return await undestroyDreamWithTransaction(dream, txn, options)
  } else {
    const dreamClass = dream.constructor as typeof Dream
    return await withConcurrentWriterRetry(
      dreamClass,
      async txn => await undestroyDreamWithTransaction<I>(dream, txn, options)
    )
  }
}

/**
 * @internal
 *
 * Given a transaction, applies the undestroy query,
 * including cascading to child associations and
 * model hooks.
 */
async function undestroyDreamWithTransaction<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I>,
  options: UndestroyOptions<I>
): Promise<I> {
  const { cascade, skipHooks } = options

  // Whether a `dependent: 'destroy'` cascade reached this record, which decides
  // whether its restore takes the scope lock. Consumed first, before a hook or
  // the cascade below can re-enter this function for the same instance.
  const cascaded = consumeSortableCascadeEdge(dream) !== null

  if (!skipHooks) {
    await runHooksFor('beforeUpdate', dream, true, null, txn)
  }

  // The cascade runs ahead of the restore, matching `destroyDream`: a direct
  // undestroy takes this record's own scope lock inside `doUndestroyDream`, so
  // a cascade seated after it would hold that lock across every descendant's
  // undestroy. The nested select the cascade builds bypasses the soft-delete
  // scope on this record's own class (`undestroyOptions`), so it reaches the
  // children while this record is still deleted.
  if (cascade) {
    await undestroyAssociatedRecords(dream, txn, options)
  }

  const restoredRowCount = await doUndestroyDream(dream, txn, { lock: !cascaded })

  // A restore of a row that is not deleted — a second `undestroy()`, a job
  // retry, or a record that was never destroyed, which `Query#undestroy` reaches
  // routinely since it lifts the soft-delete scope and walks every match —
  // matches no row, so there is nothing for the after-update hooks to react to.
  if (!skipHooks && restoredRowCount > 0) {
    await runHooksFor('afterUpdate', dream, true, null, txn)
    await runHooksFor('afterUpdateCommit', dream, true, null, txn)
  }

  await dream.txn(txn).reload()
  return dream
}

/**
 * @internal
 *
 * Clears the record's `deletedAt` and, for a sortable model, gives it a
 * position at the end of the sort scope its row physically occupies.
 *
 * Restoring is conditional on the row still being deleted, and the count of
 * rows the statement matched is what the caller reads that off. A row that is
 * already back would otherwise be inside the `max(position)` its new position
 * is computed from, and would move one past itself on every repeat — a
 * permanent gap in the scope.
 *
 * @param lock - whether to take each sortable field's scope lock around the
 *   position computation. A direct undestroy does; a cascaded one does not,
 *   since a cascade would otherwise hold one lock per distinct sort scope it
 *   restores into until the root transaction commits. Without the lock the
 *   `max(position) + 1` below can race a concurrent writer of the scope onto the
 *   same position, which the scope's deferrable unique constraint refuses at
 *   COMMIT; see `withConcurrentWriterRetry`.
 * @returns the number of rows restored: 1, or 0 when the row was not deleted
 */
async function doUndestroyDream<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I>,
  { lock }: { lock: boolean }
): Promise<number> {
  const updateStatement = txn.kyselyTransaction.updateTable(dream.table as any) as UpdateQueryBuilder<
    any,
    any,
    any,
    UpdateResult
  >

  let query = updateStatement
    .where(dream['_primaryKey'], '=', dream.primaryKeyValue())
    .where(dream['_deletedAtField'], 'is not', null)
    .set({ [dream['_deletedAtField']]: null } as any)

  const dreamClass = dream.constructor as typeof Dream
  const sortableFields = (dreamClass['sortableFields'] ?? []) as SortableFieldConfig[]

  // Undestroy has no sortable hook of its own — the position is recomputed
  // inline, below, before `afterUpdate` ever runs — so a direct undestroy takes
  // the scope lock here, around that recomputation.
  //
  // The scope this record is being restored into is the one its row physically
  // carries, not the one the instance was loaded with: another writer may have
  // moved it between scopes while it was soft deleted. The stabilized
  // acquisition converges on that scope; the unlocked read simply reads it.
  const { snapshots } = lock
    ? await acquireStabilizedSortableScopeLocks(dream, txn, sortableFields)
    : await readSortableSnapshots(dream, txn, sortableFields)

  sortableFields.forEach(sortableFieldMetadata => {
    const positionColumn = sortableFieldMetadata.positionField
    const snapshot = snapshots.get(positionColumn)
    query = query.set(
      eb =>
        ({
          [positionColumn]: eb(
            (
              filterQueryToScopeValues(
                dream,
                txn.kyselyTransaction.selectFrom(dream.table),
                column => snapshotScopeValue(snapshot, column, () => (dream as any)[column]),
                sortableFieldMetadata.scope
              ) as SelectQueryBuilder<any, any, any>
            ).select(eb =>
              // `max` over a scope with no positioned rows left — an empty
              // scope, or one whose every remaining row is soft deleted and so
              // carries a NULL position — is NULL, and NULL + 1 is NULL, which
              // would restore the record with no position at all. Coalescing
              // before the increment restores it at position 1.
              eb.fn.coalesce(eb.fn.max(positionColumn), eb.lit(0)).as(positionColumn + '_max')
            ) as any,
            '+',
            1
          ),
        }) as any
    )
  })

  const [result] = await query.execute()

  // No sortable row cache invalidation here: the restored record took a position
  // at the end of the scope it was restored into and nothing else moved, so no
  // other record's cached preflight row went stale, and this record's own cached
  // row was consumed — destructively — by the snapshot read every sortable field
  // above goes through.
  return Number(result?.numUpdatedRows ?? 0)
}

/**
 * @internal
 *
 * Undestroys all HasOne/HasMany associations on this dream that are marked as
 * `dependent: 'destroy'`: the walk `Query#undestroy` makes, with each record
 * marked as reached by this cascade before its own undestroy runs, so that its
 * restore takes no scope lock.
 */
async function undestroyAssociatedRecords<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I>,
  options: UndestroyOptions<I>
) {
  const dreamClass = dream.constructor as typeof Dream

  for (const associationName of dreamClass['dependentDestroyAssociationNames']()) {
    const association = dreamClass['associationMetadataMap']()[associationName] as
      | SortableCascadeEdge
      | undefined
    const associatedClass = association?.modelCB?.()

    if (Array.isArray(associatedClass)) {
      // TODO: decide how to handle polymorphic associations with dependent: destroy
      // raise?
    } else if (association && associatedClass?.['softDelete']) {
      const query = associationUpdateQuery(dream, txn, associationName as any, {
        joinAndStatements: {},
        bypassAllDefaultScopes: options.bypassAllDefaultScopes ?? false,
        defaultScopesToBypass: (options.defaultScopesToBypass ?? []) as string[],
      })

      await query.removeDefaultScope(SOFT_DELETE_SCOPE_NAME as any).findEach(async record => {
        markSortableCascadeEdge(record, association)
        await (record as any).txn(txn).undestroy(options)
      })
    }
  }
}
