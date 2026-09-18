import Dream from '../../../../Dream.js'
import { HasStatement } from '../../../../types/associations/shared.js'

export type SortableCascadeEdge = HasStatement<any, any, any, any, 'HasOne' | 'HasMany'>

/**
 * @internal
 *
 * Marks a Dream instance as one a `dependent: 'destroy'` cascade reached
 * through the given association, so that the sortable phases of its own destroy
 * can tell a cascaded destroy from a direct one and can see which edge carried
 * the cascade to it.
 *
 * A direct `destroy()` never carries this, which is what keeps the direct path
 * on today's behavior: the optimistic cascade predicate fails closed with no
 * edge to evaluate.
 *
 * This follows the `CASCADE_LOADED` marker in `destroyAssociatedRecords`: a
 * plain symbol-keyed assignment rather than `Object.defineProperty`, since a
 * symbol is already excluded from `Object.keys`, `for...in` and
 * `JSON.stringify`, and this runs once per node of a potentially wide cascade
 * tree.
 */
const SORTABLE_CASCADE_EDGE = Symbol.for('dream:sortableCascadeEdge')

/**
 * @internal
 *
 * Records the association a cascade is about to destroy this record through.
 */
export function markSortableCascadeEdge(dream: Dream, association: SortableCascadeEdge): void {
  ;(dream as any)[SORTABLE_CASCADE_EDGE] = association
}

/**
 * @internal
 *
 * Reads the cascade edge off the instance and removes it, so that one destroy
 * consumes it exactly once. Leaving it behind would let a later direct destroy
 * of the same instance — after an intervening undestroy, say — inherit a
 * cascade's optimism, which is the one way this marker could fail open.
 *
 * @returns the association the cascade reached this record through, or null
 *   when this is a direct destroy
 */
export function consumeSortableCascadeEdge(dream: Dream): SortableCascadeEdge | null {
  const association = (dream as any)[SORTABLE_CASCADE_EDGE] as SortableCascadeEdge | undefined
  if (association === undefined) return null
  delete (dream as any)[SORTABLE_CASCADE_EDGE]
  return association
}
