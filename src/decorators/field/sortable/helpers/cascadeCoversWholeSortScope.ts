import Dream from '../../../../Dream.js'
import { SOFT_DELETE_SCOPE_NAME } from '../../../class/SoftDelete.js'
import { SortableFieldConfig } from '../Sortable.js'
import { SortableCascadeEdge } from './sortableCascadeEdge.js'
import sortableScopeColumns from './sortableScopeColumns.js'

/**
 * @internal
 *
 * The one rule both optimistic cascade paths are gated by, evaluated per
 * (cascade edge, sortable field): whether the cascade's own set covers that
 * field's whole sort scope, so that no row of the scope is left behind by the
 * destroy — or left out of the restore. Every clause fails closed to today's
 * locking, so an association shape this does not positively recognize keeps the
 * behavior it has always had.
 *
 * 1. There is a cascade edge at all. A direct `destroy()` carries none and is
 *    never optimistic.
 * 2. The edge is a `HasMany`. A `HasOne` reaches one row of a scope that may
 *    hold others, so its destroy leaves survivors.
 * 3. The edge's foreign key is one of the field's sort scope columns. This is
 *    the whole-scope condition: every row the cascade destroys shares that
 *    foreign key value, and every row of any sort scope containing that column
 *    shares it too, so the destroy set covers the scope. Extra scope members
 *    only partition that set further and still qualify, whether they are
 *    further foreign keys or plain columns — but a plain column satisfies this
 *    clause itself only when it *is* the edge's foreign-key column.
 * 4. The edge carries no `and`/`andNot`/`andAny`/`selfAnd`/`selfAndNot`, and is
 *    not a `through` association. A conditioned cascade destroys a subset of
 *    the foreign key's rows, leaving the rest of the scope live. (Dream's types
 *    already forbid `dependent` on a `through` association; the check is here
 *    because the consequence of being wrong is silent.)
 * 5. The edge is not polymorphic. A polymorphic foreign key identifies a row
 *    only together with its type column, so the foreign-key value alone does
 *    not describe the destroy set.
 * 6. The target is not an STI child. Such an edge destroys only the rows of one
 *    subclass, while the sort scope holds every subclass's rows.
 * 7. The target declares no default scope other than SoftDelete. Any other
 *    default scope hides rows from the cascade's own load, so those rows
 *    survive in a scope this would have declared empty. SoftDelete is the
 *    exception because a soft-deleted row has already had its position columns
 *    nulled and is therefore in no sort scope to begin with.
 */
export default function cascadeCoversWholeSortScope(
  dream: Dream,
  config: SortableFieldConfig,
  edge: SortableCascadeEdge | null
): boolean {
  if (!edge) return false
  if (edge.type !== 'HasMany') return false
  if (edge.polymorphic) return false
  if (edge.through) return false
  if (edge.and || edge.andNot || edge.andAny || edge.selfAnd || edge.selfAndNot) return false

  const dreamClass = dream.constructor as typeof Dream
  if (dreamClass['isSTIChild']) return false
  if (!softDeleteIsTheOnlyDefaultScope(dreamClass)) return false

  return sortableScopeColumns(dream, config.scope).includes(edge.foreignKey())
}

function softDeleteIsTheOnlyDefaultScope(dreamClass: typeof Dream): boolean {
  return dreamClass['scopes'].default.every(scope => scope.method === SOFT_DELETE_SCOPE_NAME)
}
