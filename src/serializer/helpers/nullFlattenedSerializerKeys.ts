import Dream from '../../Dream.js'
import snakeify from '../../helpers/snakeify.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../../types/openapi.js'
import {
  DreamModelSerializerType,
  SerializerCasing,
  SimpleObjectSerializerType,
} from '../../types/serializer.js'
import DreamSerializerBuilder from '../builders/DreamSerializerBuilder.js'
import { inferSerializersFromDreamClassOrViewModelClass } from './inferSerializerFromDreamOrViewModel.js'
import { serializersForAssociatedClass } from './serializersForAssociatedClass.js'

export interface NullFlattenedSerializerKeysOptions {
  casing?: SerializerCasing
  passthroughData?: object
}

interface NullFlattenedSerializerKeysWalk {
  casing: SerializerCasing
  passthroughData: object
  serializersBeingFlattened: Set<DreamModelSerializerType | SimpleObjectSerializerType>
}

/**
 * The keys a flattened `rendersOne` adds to the parent's payload when its associated object is
 * null, returned as an object with each key set to `null`, ready to spread into the parent's
 * payload (`Object.keys` of it for the key names alone): each key any of `serializers` declares,
 * cased per `casing`. There are several serializers when the association is a polymorphic
 * BelongsTo, one for each target class, or when the associated class is an STI base, one for each
 * child, and their keys are unioned.
 *
 * Each serializer is built with `undefined` data to read its declarations, as Psychic's OpenAPI
 * generation and `preloadFor` build it, and nothing is rendered: no attribute callback runs and
 * no association of the missing object is read. A flattened `rendersOne` it declares adds its
 * own serializers' keys the same way. A flattened `customAttribute` adds the keys its `openapi`
 * declares: every key of its `properties`, the keys of the serializer a `$serializer` ref names or
 * of every serializer a `$serializable` ref resolves to (one per child for an STI base), walked
 * the same way, and the union of the keys of every member of an `allOf`, `anyOf` or `oneOf`. A ref
 * with `many: true` adds none, since a list has no keys to spread. A serializer reached again, as
 * when one flattens itself, adds nothing, so the walk always terminates.
 *
 * `passthroughData` is handed to each serializer as it is built, as when rendering; outside a
 * render it may be left out.
 */
export function nullFlattenedSerializerKeys(
  serializers: (DreamModelSerializerType | SimpleObjectSerializerType)[],
  { casing = 'camel', passthroughData = {} }: NullFlattenedSerializerKeysOptions = {}
): Record<string, null> {
  return walkSerializers(serializers, {
    casing,
    passthroughData,
    serializersBeingFlattened: new Set(),
  })
}

function walkSerializers(
  serializers: (DreamModelSerializerType | SimpleObjectSerializerType)[],
  walk: NullFlattenedSerializerKeysWalk
): Record<string, null> {
  return serializers.reduce<Record<string, null>>((flattenedKeys, serializer) => {
    // a serializer reached again, e.g. one that flattens itself directly or through others, or
    // one that two polymorphic targets or two STI children both flatten, adds no keys the first
    // walk through it did not
    if (walk.serializersBeingFlattened.has(serializer)) return flattenedKeys
    walk.serializersBeingFlattened.add(serializer)

    const serializerBuilder = serializer(undefined as any, walk.passthroughData) as DreamSerializerBuilder<
      any,
      any
    >
    const dreamClass =
      serializerBuilder instanceof DreamSerializerBuilder
        ? (serializerBuilder['$typeForOpenapi'] as typeof Dream)
        : null

    return serializerBuilder['attributes'].reduce<Record<string, null>>((keys, attribute) => {
      const attributeType = attribute.type
      switch (attributeType) {
        case 'attribute':
        case 'delegatedAttribute':
        case 'rendersMany':
          keys[setCase(attribute.options?.as ?? attribute.name, walk.casing)] = null
          return keys

        case 'customAttribute':
          if (!attribute.options.flatten) {
            keys[setCase(attribute.name, walk.casing)] = null
            return keys
          }

          return {
            ...keys,
            ...nullFlattenedOpenapiKeys(attribute.options.openapi, walk),
          }

        case 'rendersOne':
          if (!attribute.options.flatten) {
            keys[setCase(attribute.options.as ?? attribute.name, walk.casing)] = null
            return keys
          }

          return {
            ...keys,
            ...walkSerializers(
              serializersForAssociatedClass(dreamClass, attribute.name, attribute.options),
              walk
            ),
          }

        default: {
          // protection so that if a new ValidationType is ever added, this will throw a type error at build time
          const _never: never = attributeType
          throw new Error(`Unhandled serializer attribute type: ${_never as string}`)
        }
      }
    }, flattenedKeys)
  }, {})
}

function nullFlattenedOpenapiKeys(
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
  walk: NullFlattenedSerializerKeysWalk
): Record<string, null> {
  if (typeof openapi !== 'object' || Array.isArray(openapi)) return {}

  if ('$serializer' in openapi) {
    if (openapi.many) return {}
    return walkSerializers([openapi.$serializer], walk)
  }

  if ('$serializable' in openapi) {
    if (openapi.many) return {}
    return walkSerializers(
      inferSerializersFromDreamClassOrViewModelClass(
        openapi.$serializable,
        openapi.$serializableSerializerKey ?? openapi.key
      ),
      walk
    )
  }

  const keys = Object.keys(('properties' in openapi && openapi.properties) || {}).reduce<
    Record<string, null>
  >((propertyKeys, key) => {
    propertyKeys[setCase(key, walk.casing)] = null
    return propertyKeys
  }, {})

  const members = [
    ...(('allOf' in openapi && openapi.allOf) || []),
    ...(('anyOf' in openapi && openapi.anyOf) || []),
    ...(('oneOf' in openapi && openapi.oneOf) || []),
  ]

  return members.reduce<Record<string, null>>(
    (keys, member) => ({
      ...keys,
      ...nullFlattenedOpenapiKeys(member, walk),
    }),
    keys
  )
}

function setCase(attr: string, casing: SerializerCasing) {
  switch (casing) {
    case 'camel':
      return attr
    case 'snake':
      return snakeify(attr)
    default: {
      // protection so that if a new Casing is ever added, this will throw a type error at build time
      const _never: never = casing
      throw new Error(`Unhandled Casing: ${_never as string}`)
    }
  }
}
