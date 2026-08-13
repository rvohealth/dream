import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import { SortableFieldConfig } from '../Sortable.js'
import acquireStabilizedSortableScopeLocks from './acquireStabilizedSortableScopeLocks.js'
import clearCachedSortableValues from './clearCachedSortableValues.js'
import { cacheSortableSnapshots, clearSortableSnapshot } from './sortableSnapshot.js'

/**
 * @internal
 *
 * The sortable preparation phase of a destroy. Called from `destroyDream` after
 * every user `beforeDestroy` hook has run and before the delete — a phase, not
 * a hook among them — so the operation's whole advisory key set, across every
 * sortable field, is taken in one sorted stabilized acquisition, with one
 * snapshot SELECT covering all fields. Per-field acquisition would take
 * multi-field keys in declaration order, which deadlocks against the paths
 * that acquire sorted.
 *
 * Pre-delete is the only seat available for the snapshot read: on a hard
 * destroy the row is gone afterwards, and a soft destroy nulls the position
 * columns in the same UPDATE as `deletedAt`. The lock is taken around the read
 * so the snapshot cannot be invalidated between the read and the compaction;
 * it is transaction-scoped, and `destroyDream` opens a transaction that spans
 * the delete and the after-destroy hooks, so one acquisition covers both.
 *
 * The per-field `afterDestroy` compactions consume the cached snapshots.
 *
 * @returns false when the snapshot read found no row — this destroy has nothing
 *   to vacate, and compacting from the instance's remembered position would
 *   shift a scope some other writer has already closed. The delete's own
 *   affected-row count is the stronger signal (a writer outside the sortable
 *   path can remove the row after this read), so the caller checks both.
 */
export default async function prepareSortableFieldsForDestroy(
  dream: Dream,
  txn: DreamTransaction<any>
): Promise<boolean> {
  const sortableFields = (dream.constructor as typeof Dream)['sortableFields'] as SortableFieldConfig[]
  if (!sortableFields.length) return true

  const { rowExists, snapshots } = await acquireStabilizedSortableScopeLocks(dream, txn, sortableFields)
  cacheSortableSnapshots(dream, snapshots)
  return rowExists
}

/**
 * @internal
 *
 * Discards what the preparation phase stashed on the instance. The per-field
 * `afterDestroy` compaction clears its own snapshot as it consumes it, so this
 * exists for the path where that compaction never runs: a destroy that removed
 * nothing leaves the snapshot behind, and a later save or destroy of the same
 * instance would compute its shift from a reading of a row this operation
 * already found gone.
 */
export function clearSortableFieldsForDestroy(dream: Dream) {
  const sortableFields = ((dream.constructor as typeof Dream)['sortableFields'] ??
    []) as SortableFieldConfig[]

  for (const { positionField } of sortableFields) {
    clearCachedSortableValues(dream, positionField)
    clearSortableSnapshot(dream, positionField)
  }
}
