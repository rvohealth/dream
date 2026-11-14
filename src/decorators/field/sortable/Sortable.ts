import Dream from '../../../Dream.js'
import { DecoratorContext } from '../../DecoratorContextType.js'
import registerOnce from '../../helpers/registerOnce.js'
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
      registerOnce(
        dreamClass,
        'sortableFields',
        { scope: scopeArray(opts.scope), positionField: key },
        (existing, entry) => existing.positionField === entry.positionField
      )
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
