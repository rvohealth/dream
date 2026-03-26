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
  sourceDreamClass: typeof Dream
  type: 'rendersOne' | 'rendersMany' | 'delegatedAttribute'
  serializerAssociationName: string
  targets: {
    dreamClass: typeof Dream
    serializer: DreamModelSerializerType | SimpleObjectSerializerType
  }[]
}

export default function resolveSerializerAssociationEdges(
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
          sourceDreamClass: dreamClass,
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
        sourceDreamClass: dreamClass,
        type: serializerAssociation.type,
        serializerAssociationName,
        targets,
      }
    })
  )
}
