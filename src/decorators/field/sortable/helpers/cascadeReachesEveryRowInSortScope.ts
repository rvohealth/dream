import Dream from '../../../../Dream.js'
import { SOFT_DELETE_SCOPE_NAME } from '../../../class/SoftDelete.js'
import { SortableFieldConfig } from '../Sortable.js'
import { SortableCascadeEdge } from './sortableCascadeEdge.js'
import sortableScopeColumns from './sortableScopeColumns.js'

/**
 * @internal
 *
 * Whether a cascade reaching this record through `edge` reaches, and so
 * destroys, every live row of the sortable field's sort scope. Such a scope is
 * left with no survivor, so
 * the compaction a destroy performs would close a vacancy nothing can observe,
 * and the cascade skips it along with the snapshot read it needs. Every clause
 * fails closed: a shape not positively recognized here compacts as a direct
 * destroy does, unlocked, which costs statements and never a lock.
 *
 * The edge is the `dependent: 'destroy'` association the cascade destroyed
 * through, the only kind the caller passes, and the answer is about that edge
 * alone: another dependent edge of the same owner may reach the rows this one
 * does not, and this fails closed rather than look for it.
 *
 * 1. The edge is a `HasMany`. A `HasOne` reaches one row of a scope that may
 *    hold others.
 * 2. The edge is not polymorphic, is not a `through` association, and carries
 *    no `and`, `andNot`, `andAny`, `selfAnd` or `selfAndNot`. Each of those
 *    reaches a subset of the rows sharing the foreign key, and the rest can
 *    stay live: a soft-deleted owner's row remains, so no foreign key forces
 *    them out, and they keep their positions in a scope the cascade did not
 *    empty. (A hard destroy under a database foreign key would have refused to
 *    leave them, and compacting there is the harmless direction to be wrong in.)
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
export default function cascadeReachesEveryRowInSortScope(
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
