import { SelectQueryBuilder, UpdateQueryBuilder, UpdateResult } from 'kysely'
import acquireStabilizedSortableScopeLocks from '../../decorators/field/sortable/helpers/acquireStabilizedSortableScopeLocks.js'
import filterQueryToScopeValues from '../../decorators/field/sortable/helpers/filterQueryToScopeValues.js'
import { snapshotScopeValue } from '../../decorators/field/sortable/helpers/sortableSnapshot.js'
import { SortableFieldConfig } from '../../decorators/field/sortable/Sortable.js'
import Dream from '../../Dream.js'
import DreamTransaction from '../DreamTransaction.js'
import { DestroyOptions as OptionalDestroyOptions } from './destroyOptions.js'
import runHooksFor from './runHooksFor.js'

type UndestroyOptions<DreamInstance extends Dream> = Required<OptionalDestroyOptions<DreamInstance>>

/**
 * @internal
 *
 * Destroys the Dream and any `dependent: 'destroy'` associations
 * within a transaction. If a transaction is passed, it will be used.
 * Otherwise, a new transaction will be created automatically.
 * If any of the nested associations fails to destroy, then this
 * record will also fail to destroy. If skipHooks is true, model hooks
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
    return await dreamClass.transaction(
      async txn => await undestroyDreamWithTransaction<I>(dream, txn, options)
    )
  }
}

/**
 * @internal
 *
 * Given a transaction, applies the destroy query,
 * including cascading to child associations and
 * model hooks.
 */
async function undestroyDreamWithTransaction<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I>,
  options: UndestroyOptions<I>
): Promise<I> {
  const { cascade, skipHooks } = options

  if (!skipHooks) {
    await runHooksFor('beforeUpdate', dream, true, null, txn)
  }

  // The cascade runs ahead of the restore, matching `destroyDream`: this
  // record's own scope lock is taken inside `doUndestroyDream`, so a cascade
  // seated after it would hold that lock across every descendant's undestroy,
  // and a parent and its children would take their advisory keys in the
  // opposite order to the one the destroy side takes them in. The nested select
  // the cascade builds bypasses the soft-delete scope on this record's own
  // class (`undestroyOptions`), so it reaches the children while this record is
  // still deleted.
  if (cascade) {
    await undestroyAssociatedRecords(dream, txn, options)
  }

  const restoredRowCount = await doUndestroyDream(dream, txn)

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
 * @returns the number of rows restored: 1, or 0 when the row was not deleted
 */
async function doUndestroyDream<I extends Dream>(dream: I, txn: DreamTransaction<I>): Promise<number> {
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
  // inline, below, before `afterUpdate` ever runs — so the scope lock is taken
  // here, around that recomputation. Without it the `max(position) + 1`
  // subquery races every other writer of the scope the record is being restored
  // into.
  //
  // The scope this record is being restored into is the one its row physically
  // carries, not the one the instance was loaded with: another writer may have
  // moved it between scopes while it was soft deleted, which is what the
  // stabilized acquisition converges on.
  const { snapshots } = await acquireStabilizedSortableScopeLocks(dream, txn, sortableFields)

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
 * Destroys all HasOne/HasMany associations on this
 * dream that are marked as `dependent: 'destroy'`
 */
async function undestroyAssociatedRecords<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I>,
  options: UndestroyOptions<I>
) {
  const dreamClass = dream.constructor as typeof Dream

  for (const associationName of dreamClass['dependentDestroyAssociationNames']()) {
    const associationMetadata = dreamClass['associationMetadataMap']()[associationName]
    const associatedClass = associationMetadata?.modelCB?.()
    if (Array.isArray(associatedClass)) {
      // TODO: decide how to handle polymorphic associations with dependent: destroy
      // raise?
    } else {
      if (associatedClass?.['softDelete']) {
        await dream.txn(txn).undestroyAssociation(associationName as any, options)
      }
    }
  }
}
