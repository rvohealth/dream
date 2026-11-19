const REFERENCE_KEYS = ['$serializer', '$serializable', '$schema', '$ref'] as const
const COMBINATOR_KEYS = ['anyOf', 'oneOf', 'allOf'] as const

export interface OpenapiShapeReference {
  key: (typeof REFERENCE_KEYS)[number]
  /**
   * Where in the shape the reference is, e.g. `properties.owner.items`; an
   * empty string for the shape itself.
   */
  path: string
}

/**
 * Finds the first reference (`$serializer`, `$serializable`, `$schema` or
 * `$ref`) at any depth of an OpenAPI shorthand shape, the runtime counterpart
 * of `OpenapiSchemaBodyShorthandWithoutRefs` for a shape that got past the
 * types (a cast, an `as const` constant, or JavaScript).
 *
 * It looks only where a schema can be: the shape itself, each `anyOf`,
 * `oneOf` and `allOf` branch, `items`, `additionalProperties`, each property
 * in `properties`, and `properties` itself when it is a combinator or a
 * serializer reference. A property merely named `$ref` is not a reference,
 * nor is a reference key inside a value such as `default` or `example`.
 */
export default function findOpenapiShapeReference(
  shape: unknown,
  path: string = ''
): OpenapiShapeReference | null {
  if (!isObject(shape)) return null

  const key = REFERENCE_KEYS.find(referenceKey => shape[referenceKey] !== undefined)
  if (key) return { key, path }

  for (const combinatorKey of COMBINATOR_KEYS) {
    const branches = shape[combinatorKey]
    if (!Array.isArray(branches)) continue

    for (let index = 0; index < branches.length; index++) {
      const reference = findOpenapiShapeReference(
        branches[index],
        joinPath(path, `${combinatorKey}[${index}]`)
      )
      if (reference) return reference
    }
  }

  const reference =
    findOpenapiShapeReference(shape.items, joinPath(path, 'items')) ??
    findOpenapiShapeReference(shape.additionalProperties, joinPath(path, 'additionalProperties'))
  if (reference) return reference

  const properties = shape.properties
  if (!isObject(properties)) return null

  const propertiesPath = joinPath(path, 'properties')

  // `properties` may itself be a combinator, or a serializer reference standing
  // in for every property
  if (COMBINATOR_KEYS.some(combinatorKey => Array.isArray(properties[combinatorKey])))
    return findOpenapiShapeReference(properties, propertiesPath)

  if (typeof properties.$serializer === 'function') return { key: '$serializer', path: propertiesPath }
  if (typeof properties.$serializable === 'function') return { key: '$serializable', path: propertiesPath }

  for (const [propertyName, propertyShape] of Object.entries(properties)) {
    const propertyReference = findOpenapiShapeReference(propertyShape, joinPath(propertiesPath, propertyName))
    if (propertyReference) return propertyReference
  }

  return null
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function joinPath(path: string, segment: string) {
  return path === '' ? segment : `${path}.${segment}`
}
