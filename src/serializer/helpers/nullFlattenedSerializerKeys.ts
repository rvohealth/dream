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
 * The keys a flattened `customAttribute` with this `openapi` adds to the parent's payload, each
 * set to `null`, beside the non-null `value` its callback returned, from which the rendered
 * variant is read. A serializer's declarations are the rendered variant, so a `$serializable` ref
 * to an STI base adds the keys of every other child, as `nullFlattenedOpenapiKeysOfOtherVariants`
 * reads them; the serializer renders each of its own keys. A plain object renders only the keys
 * it has, so it adds each key the rendered variant requires that the object leaves out as well as
 * each key another variant requires that the rendered one does not declare. An `openapi` with one
 * variant is the rendered one. Of several variants (the members of an `anyOf` or `oneOf`, or one
 * `$serializer` per child of a `$serializable` ref to an STI base, a member with several variants
 * of its own contributing each of them, an `anyOf` and a `oneOf` beside each other pairing each
 * variant of one with each of the other, and an `allOf` beside an `anyOf` or `oneOf` joining each
 * of its variants, as `flattenedOpenapiVariants` lists them), the rendered one is the variant that
 * declares every key the object has; when several do, the first of them whose required keys the
 * object all has, and when none is found, the object adds each key any variant requires. The
 * object's top-level keys render cased per `casing`, so they are compared cased, and a key it has
 * is never added.
 */
export function nullFlattenedOpenapiKeysForValue(
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
  value: unknown,
  options: NullFlattenedSerializerKeysOptions = {}
): Record<string, null> {
  if (value instanceof DreamSerializerBuilder || value instanceof ObjectSerializerBuilder)
    return nullKeysRequiredByOthers(
      walkOpenapi(openapi, newWalk(options)),
      Object.keys(walkSerializerBuilder(value as DreamSerializerBuilder<any, any>, newWalk(options)))
    )

  if (typeof value !== 'object' || value === null) return {}

  const { casing } = newWalk(options)
  const valueKeys = Object.keys(value).map(key => setCase(key, casing))
  const variants = flattenedOpenapiVariants(openapi)
  const candidates = variants
    .map(variant => ({ variant, requirements: walkOpenapi(variant, newWalk(options)) }))
    .filter(({ requirements }) =>
      valueKeys.every(key => Object.prototype.hasOwnProperty.call(requirements, key))
    )
  const renderedVariant =
    variants.length < 2
      ? openapi
      : candidates.length === 1
        ? candidates[0]!.variant
        : candidates.find(({ requirements }) =>
            Object.keys(requirements).every(key => !requirements[key] || valueKeys.includes(key))
          )?.variant

  const requiredKeys = renderedVariant
    ? {
        ...nullFlattenedOpenapiKeysOfOtherVariants(openapi, renderedVariant, options),
        ...nullFlattenedOpenapiKeys(renderedVariant, options),
      }
    : nullFlattenedOpenapiKeys(openapi, options)

  valueKeys.forEach(key => delete requiredKeys[key])
  return requiredKeys
}

/**
 * The shapes a value of `openapi` may take, each one a variant a plain object may render: a
 * `$serializer` ref to each serializer a `$serializable` ref resolves to, or the members of an
 * `anyOf` or `oneOf`, each member that itself has several variants (a nested `anyOf` or `oneOf`,
 * or a `$serializable` ref to an STI base) contributing those variants in its place. An `anyOf`
 * and a `oneOf` beside each other each describe every value, so each variant is one of the
 * `anyOf`'s variants paired with one of the `oneOf`'s, `{ allOf: [anyOfVariant, oneOfVariant] }`,
 * ordered by the `anyOf` variant and then the `oneOf` one. An `allOf` beside them also describes
 * every value, so each variant is that `allOf` with the variant (or the pair) added to its members.
 * Anything else (a single shape, a ref with `many: true`, or a primitive) has no variants and
 * returns an empty list. Each variant may be passed back as the `renderedVariant` of
 * `nullFlattenedOpenapiKeysOfOtherVariants`.
 */
export function flattenedOpenapiVariants(
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes
): OpenapiSchemaBodyShorthand[] {
  if (typeof openapi !== 'object' || Array.isArray(openapi)) return []

  if ('$serializable' in openapi)
    return openapi.many
      ? []
      : inferSerializersFromDreamClassOrViewModelClass(
          openapi.$serializable,
          openapi.$serializableSerializerKey ?? openapi.key
        ).map(serializer => ({ $serializer: serializer }))

  const anyOfVariants = expandedMemberVariants(('anyOf' in openapi && openapi.anyOf) || [])
  const oneOfVariants = expandedMemberVariants(('oneOf' in openapi && openapi.oneOf) || [])
  const sharedMembers = ('allOf' in openapi && openapi.allOf) || []

  if (anyOfVariants.length && oneOfVariants.length)
    return anyOfVariants.flatMap(anyOfVariant =>
      oneOfVariants.map(oneOfVariant => ({ allOf: [...sharedMembers, anyOfVariant, oneOfVariant] }))
    )

  const variants = [...anyOfVariants, ...oneOfVariants]
  return sharedMembers.length ? variants.map(variant => ({ allOf: [...sharedMembers, variant] })) : variants
}

/**
 * The members of an `anyOf` or `oneOf`, each member that itself has several variants
 * contributing those variants in its place.
 */
function expandedMemberVariants(members: OpenapiSchemaBodyShorthand[]): OpenapiSchemaBodyShorthand[] {
  return members.flatMap(member => {
    const memberVariants = flattenedOpenapiVariants(member)
    return memberVariants.length > 1 ? memberVariants : [member]
  })
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
