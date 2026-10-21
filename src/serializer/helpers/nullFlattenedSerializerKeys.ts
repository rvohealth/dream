import Dream from '../../Dream.js'
import snakeify from '../../helpers/snakeify.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../../types/openapi.js'
import {
  DreamModelSerializerType,
  SerializerCasing,
  SimpleObjectSerializerType,
} from '../../types/serializer.js'
import DreamSerializerBuilder from '../builders/DreamSerializerBuilder.js'
import ObjectSerializerBuilder from '../builders/ObjectSerializerBuilder.js'
import { inferSerializersFromDreamClassOrViewModelClass } from './inferSerializerFromDreamOrViewModel.js'
import { serializersForAssociatedClass } from './serializersForAssociatedClass.js'

export interface NullFlattenedSerializerKeysOptions {
  casing?: SerializerCasing
  passthroughData?: object
}

/**
 * Each key a flattened serializer or `openapi` declares, mapped to whether any declaration of it
 * requires it: `false` only when every declaration marks it optional, i.e. an attribute,
 * delegatedAttribute or customAttribute with `required: false`, or an `openapi` property the
 * `required` list of every object shape declaring it, or of every shape it is a member of, leaves out.
 */
type KeyRequirements = Record<string, boolean>

interface NullFlattenedSerializerKeysWalk {
  casing: SerializerCasing
  passthroughData: object
  serializersBeingFlattened: Set<DreamModelSerializerType | SimpleObjectSerializerType>
}

/**
 * The keys a flattened `rendersOne` adds to the parent's payload when its associated object is
 * null, returned as an object with each key set to `null`, ready to spread into the parent's
 * payload (`Object.keys` of it for the key names alone): each key one of `serializers` requires.
 * As a property read on an empty object is `undefined`, a null value carries no key it may omit:
 * an attribute, delegatedAttribute or customAttribute declared with `required: false` adds no key.
 * Every key is cased per `casing`, as the renderer cases it. There are several serializers when
 * the association is a polymorphic BelongsTo, one for each target class, or when the associated
 * class is an STI base, one for each child, and their required keys are unioned.
 *
 * Each serializer is built with `undefined` data to read its declarations, as Psychic's OpenAPI
 * generation and `preloadFor` build it, and nothing is rendered: no attribute callback runs and
 * no association of the missing object is read. A non-flattened `rendersOne` or a `rendersMany`
 * always adds its key. A flattened `rendersOne` it declares adds its own serializers' required keys
 * the same way. A flattened `customAttribute` adds the keys its `openapi` requires: each key of
 * its `properties` that the shape's `required` array lists, the required keys of the serializer a
 * `$serializer` ref names or of every serializer a `$serializable` ref resolves to (one per child
 * for an STI base), walked the same way, and the union of the keys every member of an `allOf`,
 * `anyOf` or `oneOf` requires, with each key an object shape's own `required` array lists beside
 * its members; one declared with `required: false` adds none. A ref with `many: true` adds none,
 * since a list has no keys to spread. A serializer reached again within its own walk, as when one
 * flattens itself, adds nothing, so the walk always terminates; one reached again along another
 * path is walked again, so each path adds its keys and their requirements.
 *
 * `passthroughData` is handed to each serializer as it is built, as when rendering; outside a
 * render it may be left out.
 */
export function nullFlattenedSerializerKeys(
  serializers: (DreamModelSerializerType | SimpleObjectSerializerType)[],
  options: NullFlattenedSerializerKeysOptions = {}
): Record<string, null> {
  return nullRequiredKeys(walkSerializers(serializers, newWalk(options)))
}

/**
 * The keys a flattened `customAttribute` with this `openapi` adds to the parent's payload when
 * its callback returns null (or `undefined` without `required: false`), or a serializer built over
 * null data, each set to `null`: each key `openapi` requires, walked as `nullFlattenedSerializerKeys`
 * walks a flattened `customAttribute` and cased per `casing`.
 */
export function nullFlattenedOpenapiKeys(
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
  options: NullFlattenedSerializerKeysOptions = {}
): Record<string, null> {
  return nullRequiredKeys(walkOpenapi(openapi, newWalk(options)))
}

/**
 * The keys a present flattened `rendersOne` adds to the parent's payload, each set to `null`,
 * beside what `renderedSerializer` renders: each key one of `serializers` (every serializer the
 * association may render with) requires that `renderedSerializer` does not declare at all. A key
 * `renderedSerializer` declares is its own to render or, when `required: false`, to omit.
 */
export function nullFlattenedSerializerKeysOfOtherVariants(
  serializers: (DreamModelSerializerType | SimpleObjectSerializerType)[],
  renderedSerializer: DreamModelSerializerType | SimpleObjectSerializerType,
  options: NullFlattenedSerializerKeysOptions = {}
): Record<string, null> {
  return nullKeysRequiredByOthers(
    walkSerializers(serializers, newWalk(options)),
    Object.keys(walkSerializers([renderedSerializer], newWalk(options)))
  )
}

/**
 * The keys a flattened `customAttribute` with this `openapi` adds to the parent's payload, each
 * set to `null`, when it renders `renderedVariant`: each key a variant of `openapi` requires that
 * `renderedVariant` does not declare. `renderedVariant` is any `openapi` shorthand: one member of
 * an `anyOf` or `oneOf`, or `{ $serializer: childSerializer }` for one child of a `$serializable`
 * ref to an STI base. A key requires its value when an object shape's `required` array lists it,
 * whether the shape's own `properties` declare it or a member of its `allOf`, `anyOf` or `oneOf`
 * does, or when a serializer declares it without `required: false`.
 */
export function nullFlattenedOpenapiKeysOfOtherVariants(
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
  renderedVariant: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
  options: NullFlattenedSerializerKeysOptions = {}
): Record<string, null> {
  return nullKeysRequiredByOthers(
    walkOpenapi(openapi, newWalk(options)),
    Object.keys(walkOpenapi(renderedVariant, newWalk(options)))
  )
}

/**
 * As `nullFlattenedOpenapiKeysOfOtherVariants`, for the non-null `value` a flattened
 * `customAttribute`'s callback returned, from which the rendered variant is read. A serializer's
 * declarations are the rendered variant, so a `$serializable` ref to an STI base adds the keys of
 * every other child. A plain object returned for an `openapi` with several variants (the members
 * of an `anyOf` or `oneOf`, or one `$serializer` per child of a `$serializable` ref to an STI base)
 * renders the variant that declares every key the object has; when several do, the first of them
 * whose required keys the object all has, and when none does, the keys it has. Its top-level keys
 * render cased per `casing`, so they are compared cased. Otherwise the `openapi` has one variant,
 * the rendered one, and nothing is added.
 */
export function nullFlattenedOpenapiKeysOfOtherVariantsForValue(
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
  value: unknown,
  options: NullFlattenedSerializerKeysOptions = {}
): Record<string, null> {
  if (value instanceof DreamSerializerBuilder || value instanceof ObjectSerializerBuilder)
    return nullKeysRequiredByOthers(
      walkOpenapi(openapi, newWalk(options)),
      Object.keys(walkSerializerBuilder(value as DreamSerializerBuilder<any, any>, newWalk(options)))
    )

  const variants = openapiVariants(openapi)
  if (variants.length < 2 || typeof value !== 'object' || value === null) return {}

  const { casing } = newWalk(options)
  const valueKeys = Object.keys(value).map(key => setCase(key, casing))
  const candidates = variants
    .map(variant => ({ variant, requirements: walkOpenapi(variant, newWalk(options)) }))
    .filter(({ requirements }) =>
      valueKeys.every(key => Object.prototype.hasOwnProperty.call(requirements, key))
    )
  const renderedVariant =
    candidates.length === 1
      ? candidates[0]!.variant
      : candidates.find(({ requirements }) =>
          Object.keys(requirements).every(key => !requirements[key] || valueKeys.includes(key))
        )?.variant

  if (renderedVariant) return nullFlattenedOpenapiKeysOfOtherVariants(openapi, renderedVariant, options)
  return nullKeysRequiredByOthers(walkOpenapi(openapi, newWalk(options)), valueKeys)
}

/**
 * The shapes a value of `openapi` may take, each one a variant a plain object may render: the
 * members of an `anyOf` or `oneOf`, or a `$serializer` ref to each serializer a `$serializable`
 * ref resolves to.
 */
function openapiVariants(
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes
): (OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes)[] {
  if (typeof openapi !== 'object' || Array.isArray(openapi)) return []

  if ('$serializable' in openapi)
    return openapi.many
      ? []
      : inferSerializersFromDreamClassOrViewModelClass(
          openapi.$serializable,
          openapi.$serializableSerializerKey ?? openapi.key
        ).map(serializer => ({ $serializer: serializer }))

  return [...(('anyOf' in openapi && openapi.anyOf) || []), ...(('oneOf' in openapi && openapi.oneOf) || [])]
}

function newWalk({
  casing = 'camel',
  passthroughData = {},
}: NullFlattenedSerializerKeysOptions): NullFlattenedSerializerKeysWalk {
  return { casing, passthroughData, serializersBeingFlattened: new Set() }
}

function nullRequiredKeys(requirements: KeyRequirements): Record<string, null> {
  return Object.keys(requirements).reduce<Record<string, null>>((keys, key) => {
    if (requirements[key]) keys[key] = null
    return keys
  }, {})
}

function nullKeysRequiredByOthers(requirements: KeyRequirements, renderedKeys: string[]) {
  return Object.keys(requirements).reduce<Record<string, null>>((keys, key) => {
    if (requirements[key] && !renderedKeys.includes(key)) keys[key] = null
    return keys
  }, {})
}

/**
 * A key is required when any of its declarations requires it.
 */
function mergeRequirements(requirements: KeyRequirements, other: KeyRequirements): KeyRequirements {
  Object.keys(other).forEach(key => {
    requirements[key] = (requirements[key] ?? false) || other[key]!
  })
  return requirements
}

function walkSerializers(
  serializers: (DreamModelSerializerType | SimpleObjectSerializerType)[],
  walk: NullFlattenedSerializerKeysWalk
): KeyRequirements {
  return serializers.reduce<KeyRequirements>((flattenedKeys, serializer) => {
    // a serializer that flattens itself, directly or through others, adds no keys its walk in
    // progress does not; one reached again along another path is walked again, since a path that
    // requires its keys must not lose them to an earlier path that left them optional
    if (walk.serializersBeingFlattened.has(serializer)) return flattenedKeys
    walk.serializersBeingFlattened.add(serializer)

    const serializerBuilder = serializer(undefined as any, walk.passthroughData) as DreamSerializerBuilder<
      any,
      any
    >
    const serializerKeys = walkSerializerBuilder(serializerBuilder, walk)

    walk.serializersBeingFlattened.delete(serializer)

    return mergeRequirements(flattenedKeys, serializerKeys)
  }, {})
}

function walkSerializerBuilder(
  serializerBuilder: DreamSerializerBuilder<any, any>,
  walk: NullFlattenedSerializerKeysWalk
): KeyRequirements {
  const dreamClass =
    serializerBuilder instanceof DreamSerializerBuilder
      ? (serializerBuilder['$typeForOpenapi'] as typeof Dream)
      : null

  return serializerBuilder['attributes'].reduce<KeyRequirements>((keys, attribute) => {
    const attributeType = attribute.type
    switch (attributeType) {
      case 'attribute':
      case 'delegatedAttribute':
        return mergeRequirements(keys, {
          [setCase(attribute.options?.as ?? attribute.name, walk.casing)]:
            attribute.options?.required !== false,
        })

      case 'rendersMany':
        return mergeRequirements(keys, {
          [setCase(attribute.options?.as ?? attribute.name, walk.casing)]: true,
        })

      case 'customAttribute': {
        if (!attribute.options.flatten)
          return mergeRequirements(keys, {
            [setCase(attribute.name, walk.casing)]: attribute.options.required !== false,
          })

        const flattenedKeys = walkOpenapi(attribute.options.openapi, walk)
        // a callback that may return undefined with `required: false` adds none of its keys
        if (attribute.options.required === false)
          Object.keys(flattenedKeys).forEach(key => (flattenedKeys[key] = false))

        return mergeRequirements(keys, flattenedKeys)
      }

      case 'rendersOne':
        if (!attribute.options.flatten)
          return mergeRequirements(keys, {
            [setCase(attribute.options.as ?? attribute.name, walk.casing)]: true,
          })

        return mergeRequirements(
          keys,
          walkSerializers(serializersForAssociatedClass(dreamClass, attribute.name, attribute.options), walk)
        )

      default: {
        // protection so that if a new ValidationType is ever added, this will throw a type error at build time
        const _never: never = attributeType
        throw new Error(`Unhandled serializer attribute type: ${_never as string}`)
      }
    }
  }, {})
}

function walkOpenapi(
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
  walk: NullFlattenedSerializerKeysWalk
): KeyRequirements {
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

  const keys = Object.keys(('properties' in openapi && openapi.properties) || {}).reduce<KeyRequirements>(
    (propertyKeys, key) => {
      propertyKeys[setCase(key, walk.casing)] = false
      return propertyKeys
    },
    {}
  )

  const members = [
    ...(('allOf' in openapi && openapi.allOf) || []),
    ...(('anyOf' in openapi && openapi.anyOf) || []),
    ...(('oneOf' in openapi && openapi.oneOf) || []),
  ]

  const shapeKeys = members.reduce<KeyRequirements>(
    (keys, member) => mergeRequirements(keys, walkOpenapi(member, walk)),
    keys
  )

  // the shape's own `required` array requires a key its `properties` declare or a member declares
  const requiredKeys = ('required' in openapi && openapi.required) || []
  requiredKeys.forEach(key => {
    const casedKey = setCase(key, walk.casing)
    if (Object.prototype.hasOwnProperty.call(shapeKeys, casedKey)) shapeKeys[casedKey] = true
  })

  return shapeKeys
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
