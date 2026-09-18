import Dream from '../../../../Dream.js'
import { SortableFieldConfig } from '../Sortable.js'
import assertSortableOptimisticCascadeSupported from './assertSortableOptimisticCascadeSupported.js'
import cascadeCoversWholeSortScope from './cascadeCoversWholeSortScope.js'
import { consumeSortableCascadeEdge } from './sortableCascadeEdge.js'

export interface SortableDestroyPlan {
  /**
   * The sortable fields this destroy takes scope locks for, reads a snapshot
   * of, and compacts — today's behavior, unchanged.
   */
  locked: SortableFieldConfig[]

  /**
   * The sortable fields this destroy does none of that for, because the cascade
   * that reached this record is destroying their whole sort scope.
   */
  skipped: SortableFieldConfig[]
}

/**
 * @internal
 *
 * Decides, per sortable field, whether this destroy does its ordinary lock,
 * snapshot and compaction work or skips all three.
 *
 * A `dependent: 'destroy'` cascade takes one advisory lock per distinct sort
 * scope it touches and holds every one of them until the root transaction
 * commits, so a wide tree accumulates locks in proportion to its descendants'
 * scopes. When the cascade is destroying a sort scope's *owner*, every row in
 * that scope is itself in the destroy set: there are no survivors, so the
 * compaction those locks protect closes a vacancy nothing can observe. Both are
 * skipped for exactly that case.
 *
 * Consumes the cascade-edge marker, so it must be called once per destroy, at
 * the top, before the sortable phases run.
 */
export default function planSortableDestroyWork(dream: Dream): SortableDestroyPlan {
  const edge = consumeSortableCascadeEdge(dream)
  const sortableFields = ((dream.constructor as typeof Dream)['sortableFields'] ??
    []) as SortableFieldConfig[]

  const plan: SortableDestroyPlan = { locked: [], skipped: [] }

  for (const config of sortableFields) {
    if (cascadeCoversWholeSortScope(dream, config, edge)) plan.skipped.push(config)
    else plan.locked.push(config)
  }

  // Unconditional, and seated here rather than deeper: skipping acquisition is
  // exactly what skips `acquireSortableScopeLocks`'s own fail-loud guard.
  if (plan.skipped.length) assertSortableOptimisticCascadeSupported(dream)

  return plan
}
