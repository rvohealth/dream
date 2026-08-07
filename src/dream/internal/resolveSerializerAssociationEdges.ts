import Dream from '../../Dream.js'
import compact from '../../helpers/compact.js'
import DreamSerializerBuilder from '../../serializer/builders/DreamSerializerBuilder.js'
import { inferSerializersFromDreamClassOrViewModelClass } from '../../serializer/helpers/inferSerializerFromDreamOrViewModel.js'
import {
  DreamModelSerializerType,
  InternalAnyRendersOneOrManyOpts,
  InternalAnyTypedSerializerDelegatedAttribute,
  InternalAnyTypedSerializerRendersMany,
  InternalAnyTypedSerializerRendersOne,
  SimpleObjectSerializerType,
} from '../../types/serializer.js'

export interface ResolvedSerializerAssociationEdge {
  associationAs: string
  type: 'rendersOne' | 'rendersMany' | 'delegatedAttribute'
  serializerAssociationName: string
  targets: {
    dreamClass: typeof Dream
    serializer: DreamModelSerializerType | SimpleObjectSerializerType
  }[]
}

/**
 * Keyed on the two arguments. Weak on both, so an entry is collectable once either the Dream class
 * or the serializer is. The cached arrays are handed out by reference and must be treated as
 * read-only by callers.
 */
let resolvedEdgesCache = new WeakMap<
  typeof Dream,
  WeakMap<DreamModelSerializerType | SimpleObjectSerializerType, ResolvedSerializerAssociationEdge[]>
>()

/**
 * @internal
 *
 * Drops every memoized edge set. The memo keys on (dreamClass, serializer) but its result also
 * depends on process-global state those two keys do not capture — each target's `serializers`
 * getter, the STI children registered on each target, and the DreamApp serializer registry — so
 * anything that replaces that state must clear the memo rather than let it serve edges resolved
 * against the old state.
 *
 * In a normal application lifecycle there is nothing to clear: `DreamApp.init` loads models and
 * serializers before the first query, and none of those inputs change afterward. This exists for
 * the lifecycles where they do: a second `DreamApp.init` in one process (embedders, hot reload),
 * and specs that install or remove a `serializers` getter around an example.
 */
export function clearResolvedSerializerAssociationEdgesCache() {
  resolvedEdgesCache = new WeakMap()
}

/**
 * @internal
 *
 * Resolves the rendersOne/rendersMany/delegatedAttribute attributes of `serializer` to the
 * associations of `dreamClass` they preload, along with the classes and serializers each one
 * targets.
 *
 * Memoized on its two arguments, because every call rebuilds a throwaway serializer builder and
 * re-infers the serializers of every association target, and the traversal in
 * buildSerializerPreloadPaths revisits the same (class, serializer) pair many times.
 *
 * The two arguments are not the function's only inputs, though: resolving a target's serializers
 * also reads that target's `serializers` getter, the STI children registered on it, and the
 * DreamApp serializer registry. Like `Query`'s own preload-path cache, the memo is therefore only
 * meaningful once models and serializers are loaded (which `DreamApp.init` does at boot), and it
 * must be dropped whenever that state is replaced — see
 * `clearResolvedSerializerAssociationEdgesCache`.
 */
export default function resolveSerializerAssociationEdges(
  dreamClass: typeof Dream,
  serializer: DreamModelSerializerType | SimpleObjectSerializerType
): ResolvedSerializerAssociationEdge[] {
  let cachedForDreamClass = resolvedEdgesCache.get(dreamClass)

  if (cachedForDreamClass === undefined) {
    cachedForDreamClass = new WeakMap()
    resolvedEdgesCache.set(dreamClass, cachedForDreamClass)
  }

  const cached = cachedForDreamClass.get(serializer)
  if (cached !== undefined) return cached

  const edges = buildSerializerAssociationEdges(dreamClass, serializer)
  cachedForDreamClass.set(serializer, edges)
  return edges
}

function buildSerializerAssociationEdges(
  dreamClass: typeof Dream,
  serializer: DreamModelSerializerType | SimpleObjectSerializerType
): ResolvedSerializerAssociationEdge[] {
  const serializerBuilder = serializer(undefined as any, undefined as any) as DreamSerializerBuilder<any, any>
  const serializerAssociations = serializerBuilder['attributes'].filter(attribute =>
    ['rendersOne', 'rendersMany', 'delegatedAttribute'].includes(attribute.type as string)
  ) as (
    | InternalAnyTypedSerializerRendersMany<any>
    | InternalAnyTypedSerializerRendersOne<any>
    | InternalAnyTypedSerializerDelegatedAttribute
  )[]

  return compact(
    serializerAssociations.map(serializerAssociation => {
      const serializerAssociationName =
        (serializerAssociation as InternalAnyTypedSerializerDelegatedAttribute).targetName ??
        serializerAssociation.name

      // `dreamClass` is the class the walk is rooted at, which for an STI base is the base itself
      // even while `serializer` is one child's serializer. That pairing is safe because an STI child
      // cannot declare associations of its own — the `STI` class decorator throws
      // StiChildCannotDefineNewAssociations — so every association a child's serializer can render
      // is declared on the base and resolves here.
      //
      // The one hole: that guard reads decorator metadata and
      // `associationDeclarationNamesFromMetadata` returns [] when the metadata is absent, which is
      // also what happens when the `STI` decorator runs without a `context`. Under a TS config that
      // does not emit decorator metadata the guard silently passes, a child-declared association
      // survives, and it is dropped *here*, silently, by the return below — the symptom is then a
      // missing preload and a NonLoadedAssociation at render, not a decorator error naming the real
      // problem.
      const association = dreamClass['getAssociationMetadata'](serializerAssociationName)
      if (!association) return null

      if (serializerAssociation.type === 'delegatedAttribute') {
        return {
          associationAs: association.as,
          type: serializerAssociation.type,
          serializerAssociationName,
          targets: [],
        }
      }

      const maybeAssociatedClasses = association.modelCB()
      if (!maybeAssociatedClasses)
        throw new Error(
          `No class defined on ${serializerAssociationName} association on ${dreamClass.sanitizedName}`
        )

      const associatedClasses = Array.isArray(maybeAssociatedClasses)
        ? maybeAssociatedClasses
        : [maybeAssociatedClasses]

      const targets = associatedClasses.flatMap(associatedClass => {
        // Deliberately unguarded: every serializer that cannot be resolved while building preload
        // paths throws, and there is no tolerance here by design.
        //
        // Why: an unresolvable serializer is a configuration error, and the first query that walks
        // the serializer graph is where it should be found — no rows, no rendering required.
        // Swallowing it means the only way to discover a broken `serializerKey` (or a missing
        // `serializers` getter) is a spec that creates a row of the affected class *and* renders it.
        //
        // Why the obvious tolerance is also wrong, not merely undesirable:
        // `inferSerializersFromDreamClassOrViewModelClass` below expands STI and throws on the
        // *first* child that fails, so catching here would drop the serializers of *every* child of
        // this target. An edge with no targets is treated as terminal by buildSerializerPreloadPaths,
        // so the association is preloaded but never descended into, and a row of a *well-formed*
        // sibling fails at render with NonLoadedAssociation — an error naming a class that has
        // nothing wrong with it.
        const serializers = (serializerAssociation.options as InternalAnyRendersOneOrManyOpts).serializer
          ? compact([(serializerAssociation.options as InternalAnyRendersOneOrManyOpts).serializer])
          : compact(
              inferSerializersFromDreamClassOrViewModelClass(
                associatedClass,
                (serializerAssociation.options as InternalAnyRendersOneOrManyOpts).serializerKey
              )
            )

        return serializers.map(associatedSerializer => ({
          dreamClass: associatedClass,
          serializer: associatedSerializer,
        }))
      })

      return {
        associationAs: association.as,
        type: serializerAssociation.type,
        serializerAssociationName,
        targets,
      }
    })
  )
}
