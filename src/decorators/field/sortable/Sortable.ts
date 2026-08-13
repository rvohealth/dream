import Dream from '../../../Dream.js'
import DreamTransaction from '../../../dream/DreamTransaction.js'
import pascalize from '../../../helpers/pascalize.js'
import { DecoratorContext } from '../../DecoratorContextType.js'
import { STI_SCOPE_NAME } from '../../class/STI.js'
import { afterDestroyImplementation } from '../lifecycle/AfterDestroy.js'
import scopeArray from './helpers/scopeArray.js'
import afterSortableDestroy from './hooks/afterSortableDestroy.js'

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
      ;(dreamClass['sortableFields'] as SortableFieldConfig[]).push({
        scope: scopeArray(opts.scope),
        positionField: key,
      })

      const positionField = key

      const afterDestroyMethodName = `_setValuesAfterDestructionFor${pascalize(key)}AfterDestroy`

      const dreamPrototype = Object.getPrototypeOf(dream)

      // a save's sortable work is not registered as hooks: preparation —
      // caching the values the position work needs and applying the position
      // sentinel — runs as a phase in `saveDream` after every consumer
      // before-hook (`prepareSortableFieldsForSave`), and the position work
      // itself runs as a direct call after the driver write
      // (`performSortablePositionWork`), so no user hook code runs while the
      // scope lock is held on a self-opened save

      // a destroy's lock acquisition and snapshot read are likewise a phase,
      // not hooks: `destroyDream` calls `prepareSortableFieldsForDestroy`
      // after every user beforeDestroy hook, taking all sortable fields' keys
      // in one sorted pass with one snapshot SELECT

      // after destroy, auto-adjust positions of all related records with a greater position
      // than this one to maintain incrementing order,
      dreamPrototype[afterDestroyMethodName] = async function (txn?: DreamTransaction<any>) {
        // destroyDream always opens a transaction, so this is only ever null on a
        // path that does not destroy at all
        if (!txn) return
        const query = dreamClass.query().removeDefaultScope(STI_SCOPE_NAME).txn(txn)

        await afterSortableDestroy({
          dream: this,
          positionField,
          query,
          scope: opts.scope,
          txn,
        })
      }

      afterDestroyImplementation(dream, afterDestroyMethodName)
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
