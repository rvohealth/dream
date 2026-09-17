import Dream from '../../../Dream.js'
import { DecoratorContext } from '../../DecoratorContextType.js'
import scopeArray from './helpers/scopeArray.js'

/**
 * The implementation behind `@deco.Sortable`. The decorator's semantics —
 * position clamping, what a scope-changing save does with a position given
 * alongside it, and the advisory-lock concurrency protocol — are documented on
 * `Decorators#Sortable`, which is where a consumer reads them.
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

      // an STI child inherits its base's sortable fields via the copy above, and
      // the base's field initializers run again while the child is globally
      // initialized, so without this guard the child registers a second config
      // for the same position field whenever the base is initialized first
      // (models are globally initialized in filesystem order). Every duplicate
      // config repeats the child's position work on each save, so positions
      // advance by the number of duplicates instead of by 1
      if (dreamClass['sortableFields'].some(conf => conf.positionField === key)) {
        return
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
