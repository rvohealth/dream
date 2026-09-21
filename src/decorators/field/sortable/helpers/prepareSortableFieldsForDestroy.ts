import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import { SortableFieldConfig } from '../Sortable.js'
import acquireStabilizedSortableScopeLocks from './acquireStabilizedSortableScopeLocks.js'
import cascadeEmptiesSortScope from './cascadeEmptiesSortScope.js'
import clearCachedSortableValues from './clearCachedSortableValues.js'
import { SortableCascadeEdge } from './sortableCascadeEdge.js'
import { cacheSortableSnapshots, clearSortableSnapshot, readSortableSnapshots } from './sortableSnapshot.js'

export interface SortableDestroyPreparation {
  /**
   * False when the snapshot read found no row: this destroy has nothing to
   * vacate, and compacting from the instance's remembered position would shift
   * a scope some other writer has already closed. The delete's own affected-row
   * count is the stronger signal (a writer outside the sortable path can remove
   * the row after this read), so the caller checks both.
   */
  rowExists: boolean

  /**
   * The sortable fields whose scope this destroy compacts, for
   * `performSortableDestroyWork`.
   */
  sortableFields: SortableFieldConfig[]
}

/**
 * @internal
 *
 * The sortable preparation phase of a destroy. Called from `destroyDream` after
 * every user `beforeDestroy` hook has run and before the delete — a phase, not
 * a hook among them — so the row's real position and scope values are read in
 * one snapshot SELECT covering every field while the row still exists.
 * Pre-delete is the only seat for that read: on a hard destroy the row is gone
 * afterwards, and a soft destroy nulls the position columns in the same UPDATE
 * as `deletedAt`. The per-field compactions (`performSortableDestroyWork`)
 * consume the cached snapshots.
 *
 * A direct destroy takes the operation's whole advisory key set — every
 * sortable field — in one sorted stabilized acquisition around that read, so
 * the snapshot cannot be invalidated before the compaction; per-field
 * acquisition would take multi-field keys in declaration order and deadlock
 * against the paths that acquire sorted. The lock is transaction-scoped, and
 * `destroyDream` opens a transaction spanning the delete and the after-destroy
 * hooks, so one acquisition covers both.
 *
 * A cascaded destroy — one reached through a `dependent: 'destroy'` association,
 * which passes the edge it arrived by — takes no scope lock: a cascade would
 * otherwise hold one per distinct sort scope it touches until the root
 * transaction commits. It reads the same snapshot unlocked and compacts from
 * it, and skips both for a field whose whole sort scope the cascade is
 * destroying, since nothing survives there to observe a compaction.
 */
export default async function prepareSortableFieldsForDestroy(
  dream: Dream,
  txn: DreamTransaction<any>,
  cascadeEdge: SortableCascadeEdge | null
): Promise<SortableDestroyPreparation> {
  const allSortableFields = (dream.constructor as typeof Dream)['sortableFields'] as SortableFieldConfig[]

  const sortableFields = cascadeEdge
    ? allSortableFields.filter(config => !cascadeEmptiesSortScope(dream, config, cascadeEdge))
    : allSortableFields

  if (!sortableFields.length) return { rowExists: true, sortableFields }

  // A field the predicate does not exempt is compacted *unlocked* on a cascade,
  // by design: the predicate decides only what work is skipped, never whether a
  // lock is taken. Falling back to the lock for such a field would reintroduce
  // a lock count set by the data — one per distinct surviving scope, held to
  // the root COMMIT, drawn from the cluster-wide lock table — with no way for
  // the application to avoid it. The concurrent-writer races the missing lock
  // exposes are accepted and documented on `@deco.Sortable`, and are what
  // `withConcurrentWriterRetry` exists for.
  const { rowExists, snapshots } = cascadeEdge
    ? await readSortableSnapshots(dream, txn, sortableFields)
    : await acquireStabilizedSortableScopeLocks(dream, txn, sortableFields)

  cacheSortableSnapshots(dream, snapshots)
  return { rowExists, sortableFields }
}

/**
 * @internal
 *
 * Discards what the preparation phase stashed on the instance. The per-field
 * compaction clears its own snapshot as it consumes it, so this
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
