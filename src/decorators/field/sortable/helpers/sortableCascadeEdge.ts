import Dream from '../../../../Dream.js'
import { HasStatement } from '../../../../types/associations/shared.js'

export type SortableCascadeEdge = HasStatement<any, any, any, any, 'HasOne' | 'HasMany'>

/**
 * A symbol-keyed assignment, like the `CASCADE_LOADED` marker in
 * `destroyAssociatedRecords`: excluded from `Object.keys`, `for...in` and
 * `JSON.stringify` without a descriptor, and cheap on a wide cascade tree.
 */
const SORTABLE_CASCADE_EDGE = Symbol.for('dream:sortableCascadeEdge')

/**
 * @internal
 *
 * Marks a record a `dependent: 'destroy'` cascade is about to destroy or
 * undestroy, with the association the cascade reached it through. The record's
 * own destroy or undestroy consumes the mark and does its sortable work without
 * the scope lock a direct operation takes.
 */
export function markSortableCascadeEdge(dream: Dream, association: SortableCascadeEdge): void {
  ;(dream as any)[SORTABLE_CASCADE_EDGE] = association
}

/**
 * @internal
 *
 * The association a cascade reached this record through, or null on a direct
 * destroy or undestroy. Consuming removes the mark, so a later direct operation
 * on the same instance cannot inherit a cascade's optimism.
 */
export function consumeSortableCascadeEdge(dream: Dream): SortableCascadeEdge | null {
  const association = (dream as any)[SORTABLE_CASCADE_EDGE] as SortableCascadeEdge | undefined
  if (association === undefined) return null
  delete (dream as any)[SORTABLE_CASCADE_EDGE]
  return association
}
