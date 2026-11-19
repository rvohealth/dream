import Dream from '../../../Dream.js'
import { DecoratorContext } from '../../DecoratorContextType.js'
import { markDeclarationInMetadata } from '../../helpers/declarationMetadata.js'
import registerOnce from '../../helpers/registerOnce.js'
import scopeArray from './helpers/scopeArray.js'

/**
 * The decorator metadata key under which `@deco.Sortable` records the fields a
 * class declares itself, read by `STI()` to refuse `@deco.Sortable` on an STI
 * child.
 */
export const SORTABLE_DECLARATION_METADATA_KEY = Symbol('dream:sortableDeclarationNames')

/**
 * The implementation behind `@deco.Sortable`. The decorator's semantics —
 * position clamping, what a scope-changing save does with a position given
 * alongside it, and the advisory-lock concurrency protocol — are documented on
 * `Decorators#Sortable`, which is where a consumer reads them.
 *
 * It marks the declaration on the class's decorator metadata, so `STI()`
 * refuses it on an STI child when the child class is defined.
 */
export default function Sortable(opts: SortableOpts = {}): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    markDeclarationInMetadata(context, SORTABLE_DECLARATION_METADATA_KEY)

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
