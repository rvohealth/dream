import Dream from '../../../../Dream.js'
import { SOFT_DELETE_SCOPE_NAME } from '../../../class/SoftDelete.js'
import { SortableFieldConfig } from '../Sortable.js'
import { SortableCascadeEdge } from './sortableCascadeEdge.js'
import sortableScopeColumns from './sortableScopeColumns.js'

/**
 * @internal
 *
 * Whether a cascade reaching this record through `edge` destroys every live row
 * of the sortable field's sort scope. Such a scope is left with no survivor, so
 * the compaction a destroy performs would close a vacancy nothing can observe,
 * and the cascade skips it along with the snapshot read it needs. Every clause
 * fails closed: a shape not positively recognized here compacts as a direct
 * destroy does.
 *
 * 1. The edge is a `HasMany`. A `HasOne` reaches one row of a scope that may
 *    hold others.
 * 2. The edge is not polymorphic, is not a `through` association, and carries
 *    no `and`, `andNot`, `andAny`, `selfAnd` or `selfAndNot`. Each of those
 *    reaches a subset of the rows sharing the foreign key.
 * 3. The target is not an STI child, whose rows share a sort scope with its
 *    siblings' rows.
 * 4. The target declares no default scope other than SoftDelete, since any
 *    other hides rows from the cascade's own load. A soft-deleted row holds no
 *    position and so is in no sort scope to begin with.
 * 5. The edge's foreign key is one of the field's scope columns: every row the
 *    cascade destroys carries the owner's key, and so does every row of any sort
 *    scope that includes that column. Further scope members only partition that
 *    same set.
 */
export default function cascadeWillDestroyEveryRowInSortScope(
  dream: Dream,
  config: SortableFieldConfig,
  edge: SortableCascadeEdge
): boolean {
  if (edge.type !== 'HasMany') return false
  if (edge.polymorphic || edge.through) return false
  if (edge.and || edge.andNot || edge.andAny || edge.selfAnd || edge.selfAndNot) return false

  const dreamClass = dream.constructor as typeof Dream
  if (dreamClass['isSTIChild']) return false
  if (!dreamClass['scopes'].default.every(scope => scope.method === SOFT_DELETE_SCOPE_NAME)) return false

  return sortableScopeColumns(dream, config.scope).includes(edge.foreignKey())
}
