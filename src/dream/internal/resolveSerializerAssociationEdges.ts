import Dream from '../../Dream.js'
import MissingSerializersDefinition from '../../errors/serializers/MissingSerializersDefinition.js'
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
 * Keyed on the two arguments, which are the function's only inputs. Weak on both, so an entry is
 * collectable once either the Dream class or the serializer is. The cached arrays are handed out
 * by reference and must be treated as read-only by callers.
 */
const resolvedEdgesCache = new WeakMap<
  typeof Dream,
  WeakMap<DreamModelSerializerType | SimpleObjectSerializerType, ResolvedSerializerAssociationEdge[]>
>()

/**
 * @internal
 *
 * Resolves the rendersOne/rendersMany/delegatedAttribute attributes of `serializer` to the
 * associations of `dreamClass` they preload, along with the classes and serializers each one
 * targets.
 *
 * Pure in its two arguments and memoized on them: every call rebuilds a throwaway serializer
 * builder and re-infers the serializers of every association target, and the traversal in
 * buildSerializerPreloadPaths revisits the same (class, serializer) pair many times.
 *
 * The memo shares the staleness window of `Query`'s own preload-path cache: a target class's
 * resolved serializers depend on STI children registering themselves as their modules evaluate, so
 * both are only reliable once models are loaded (which `DreamApp#load('models')` does at boot).
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
        let serializers: (DreamModelSerializerType | SimpleObjectSerializerType)[] = []

        try {
          serializers = (serializerAssociation.options as InternalAnyRendersOneOrManyOpts).serializer
            ? compact([(serializerAssociation.options as InternalAnyRendersOneOrManyOpts).serializer])
            : compact(
                inferSerializersFromDreamClassOrViewModelClass(
                  associatedClass,
                  (serializerAssociation.options as InternalAnyRendersOneOrManyOpts).serializerKey
                )
              )
        } catch (error) {
          if (!(error instanceof MissingSerializersDefinition)) throw error
          serializers = []
        }

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
