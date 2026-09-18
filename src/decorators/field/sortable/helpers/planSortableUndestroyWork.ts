import Dream from '../../../../Dream.js'
import columnAllowsNull from '../../../../helpers/db/columnAllowsNull.js'
import { SortableFieldConfig } from '../Sortable.js'
import assertSortableOptimisticCascadeSupported from './assertSortableOptimisticCascadeSupported.js'
import cascadeCoversWholeSortScope from './cascadeCoversWholeSortScope.js'
import { consumeSortableCascadeEdge } from './sortableCascadeEdge.js'
import sortableScopeColumns from './sortableScopeColumns.js'

export interface SortableUndestroyPlan {
  /**
   * The sortable fields this undestroy takes scope locks for and positions
   * inline, from `coalesce(max(position), 0) + 1` inside the lock — today's
   * behavior, unchanged.
   */
  locked: SortableFieldConfig[]

  /**
   * The sortable fields this undestroy takes no lock for, positioning them
   * instead with one idempotent whole-scope statement that ranks the scope
   * nulls-last.
   */
  optimistic: SortableFieldConfig[]
}

/**
 * @internal
 *
 * Decides, per sortable field, whether this undestroy takes its ordinary scope
 * lock or restores optimistically.
 *
 * An undestroy cascade re-enters the same transaction once per descendant and
 * takes a scope lock for each, accumulating exactly as the destroy side did.
 * The rule is the destroy side's rule — `cascadeCoversWholeSortScope`, shared
 * rather than restated, so "a qualifying cascade" cannot come to mean two
 * different things — plus one clause that only the restore needs.
 *
 * Consumes the cascade-edge marker, so it must be called once per undestroy, at
 * the top.
 */
export default function planSortableUndestroyWork(dream: Dream): SortableUndestroyPlan {
  const edge = consumeSortableCascadeEdge(dream)
  const sortableFields = ((dream.constructor as typeof Dream)['sortableFields'] ??
    []) as SortableFieldConfig[]

  const plan: SortableUndestroyPlan = { locked: [], optimistic: [] }

  for (const config of sortableFields) {
    if (cascadeCoversWholeSortScope(dream, config, edge) && !scopeHasANullableMember(dream, config))
      plan.optimistic.push(config)
    else plan.locked.push(config)
  }

  // Unconditional, for the same reason it is on the destroy side: the skipped
  // path is what skips `acquireSortableScopeLocks`'s own fail-loud guard, and
  // that function returns before the guard on an empty key list — which an
  // all-optimistic undestroy presents.
  if (plan.optimistic.length) assertSortableOptimisticCascadeSupported(dream)

  return plan
}

/**
 * @internal
 *
 * Whether any column of the field's sort scope can hold NULL, in which case the
 * restore declines and keeps today's locking.
 *
 * The optimistic restore holds no scope lock, so what keeps a *collision* out
 * of the committed data is the deferrable unique constraint alone: an intruding
 * write that leaves two live rows of the scope sharing a position is meant to
 * abort the undestroy at commit. (An intruding write that produces no duplicate
 * is not excluded and does not abort; it can leave a gap, which `Model.resort`
 * closes.) A plain UNIQUE constraint is NULLS DISTINCT, so two rows sharing a
 * NULL scope member and the same position do not violate it — while Dream
 * matches a NULL scope value with `is null` and treats those rows as one scope.
 * For that shape the collision would commit silently instead of aborting, so
 * the one guarantee this path does rely on would simply be false.
 *
 * A column the schema does not describe is treated as nullable, so an unknown
 * shape declines rather than assuming the safe one.
 */
function scopeHasANullableMember(dream: Dream, { scope }: SortableFieldConfig): boolean {
  const dreamClass = dream.constructor as typeof Dream

  return sortableScopeColumns(dream, scope).some(column => {
    if (!dreamClass.columns().has(column)) return true
    return columnAllowsNull(dreamClass, column as any)
  })
}
