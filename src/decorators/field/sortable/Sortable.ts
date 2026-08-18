import Dream from '../../../Dream.js'
import { DecoratorContext } from '../../DecoratorContextType.js'
import scopeArray from './helpers/scopeArray.js'

/**
 * Marks an integer column as a sortable position: Dream keeps the positions of
 * every record in a sort scope contiguous, starting at 1, as records are
 * created, moved, destroyed and undestroyed.
 *
 * ```ts
 * class Post extends ApplicationModel {
 *   @deco.Sortable({ scope: 'user' })
 *   public position: number
 * }
 *
 * await post.update({ position: 2 }) // the records at 2 and above shift up
 * ```
 *
 * A position past the end of the scope is clamped to the end, and a position
 * below 1 — or none at all — lands the record at the end.
 *
 * **A save that changes the sort scope ignores a position given alongside it.**
 * The record lands at the end of the scope it moves into, whatever position the
 * same `update` supplied:
 *
 * ```ts
 * await post.update({ user: otherUser, position: 1 })
 * // post is now the last record in otherUser's scope, not the first
 * ```
 *
 * Move it in two saves to place it: `await post.update({ user: otherUser })`,
 * then `await post.update({ position: 1 })`.
 *
 * Sortable requires a query driver that supports advisory transaction locks —
 * the `PostgresQueryDriver` does — since every position write serializes the
 * writers of its sort scope on one.
 */
export default function Sortable(opts: SortableOpts = {}): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: Dream) {
      const dream = this
      const dreamClass: typeof Dream = dream.constructor as typeof Dream
      if (!dreamClass['globallyInitializingDecorators']) return

      if (!Object.getOwnPropertyDescriptor(dreamClass, 'sortableFields')) {
        // This pattern allows `sortableFields` on a base STI class and on
        // child STI classes. The new `sortableFields` property will be created
        // on the child STI class, but it will include all the `sortableFields`
        // already declared on the base STI class.
        dreamClass['sortableFields'] = [...dreamClass['sortableFields']]
      }
      // the decorator registers nothing but this metadata: none of a sortable
      // field's runtime work runs as hooks. A save's preparation and position
      // write run as phases in `saveDream` (`prepareSortableFieldsForSave`,
      // `performSortablePositionWork`), a destroy's lock acquisition, snapshot
      // read and compaction as phases in `destroyDream`
      // (`prepareSortableFieldsForDestroy`, `performSortableDestroyWork`), and
      // an undestroy's restore inline in `undestroyDream` — each seated
      // relative to the user's hooks by the caller, so no user hook code can
      // interleave with the position work and every after-hook observes
      // computed positions and compacted scopes
      ;(dreamClass['sortableFields'] as SortableFieldConfig[]).push({
        scope: scopeArray(opts.scope),
        positionField: key,
      })
    })
  }
}

interface SortableOpts {
  /**
   * A column name or array of column names that define the scope within which
   * position values are unique. Records are sorted independently within each scope.
   *
   * ```ts
   * @deco.Sortable({ scope: 'species' })
   * public positionWithinSpecies: number
   * ```
   */
  scope?: string | string[]
}

export interface SortableFieldConfig {
  scope: string[]
  positionField: string
}
