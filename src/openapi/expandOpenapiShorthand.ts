import { openapiShorthandPrimitiveTypes } from '../dream/constants.js'
import {
  OpenapiPrimitiveTypes,
  OpenapiSchemaArray,
  OpenapiSchemaBase,
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaExpressionAllOf,
  OpenapiSchemaExpressionAnyOf,
  OpenapiSchemaExpressionOneOf,
  OpenapiSchemaObject,
  OpenapiSchemaObjectBase,
  OpenapiSchemaPrimitiveGeneric,
  OpenapiSchemaProperties,
  OpenapiSchemaShorthandExpressionAllOf,
  OpenapiSchemaShorthandExpressionAnyOf,
  OpenapiSchemaShorthandExpressionOneOf,
  OpenapiShorthandAllTypes,
  OpenapiShorthandPrimitiveTypes,
} from '../types/openapi.js'
import isBlankDescription from './isBlankDescription.js'
import maybeNullOpenapiShorthandToOpenapiShorthand from './maybeNullOpenapiShorthandToOpenapiShorthand.js'
import openapiShorthandToOpenapi from './openapiShorthandToOpenapi.js'

/**
 * @internal
 *
 * A shape `expandOpenapiShorthand` expands: a shorthand or full OpenAPI shape,
 * a primitive shorthand, a description-only object, or `undefined` (which
 * expands to `{ type: 'object' }`).
 */
export type OpenapiShorthandSegment =
  | OpenapiSchemaBodyShorthand
  | OpenapiShorthandPrimitiveTypes
  | { description: string }
  | undefined

/**
 * @internal
 *
 * Called first on every object node of the shape, at any depth. Returning a
 * schema replaces the node's expansion with it; returning `undefined` hands
 * the node to the reference-free expansion. `expand` expands a child shape
 * with the same options, this hook included.
 */
export type OpenapiShorthandReferenceExpander = (
  node: object,
  expand: (segment: OpenapiShorthandSegment) => OpenapiSchemaBody
) => OpenapiSchemaBody | undefined

/**
 * @internal
 */
export interface ExpandOpenapiShorthandOptions {
  /**
   * Expands the nodes the reference-free expansion does not know (Psychic's
   * `$serializer`, `$serializable`, `$ref`, `$schema` and `for:`). Without it,
   * such a node is expanded as an ordinary object would be.
   */
  expandReference?: OpenapiShorthandReferenceExpander | undefined

  /**
   * Replaces the `enum` of a node whose `type` is exactly `'string'` with a
   * description listing the values (Psychic's `suppressResponseEnums`, for
   * response shapes). A nullable string enum keeps its `enum`.
   */
  suppressEnums?: boolean | undefined
}

/**
 * @internal
 *
 * Expands an OpenAPI shape written with Dream's shorthand into a full OpenAPI
 * schema: `'string'` → `{ type: 'string' }`, `['string', 'null']` →
 * `{ type: ['string', 'null'] }`, `'string[]'` → `{ type: 'array', items: {
 * type: 'string' } }`, and the same inside objects, arrays and compositions at
 * any depth. The input is never modified.
 *
 * This is the one expansion of model-declared shapes (`@deco.JSON`,
 * `@deco.Virtual`, `@deco.Encrypted`), which contain no reference, and,
 * through `expandReference`, of every shape Psychic renders.
 */
export default function expandOpenapiShorthand(
  segment: OpenapiShorthandSegment,
  options: ExpandOpenapiShorthandOptions = {}
): OpenapiSchemaBody {
  return new OpenapiShorthandExpander(options).expand(segment)
}

class OpenapiShorthandExpander {
  constructor(private options: ExpandOpenapiShorthandOptions) {}

  public expand = (segment: OpenapiShorthandSegment): OpenapiSchemaBody => {
    if (this.options.expandReference && typeof segment === 'object' && segment !== null) {
      const expanded = this.options.expandReference(segment, this.expand)
      if (expanded !== undefined) return expanded
    }

    switch (this.segmentType(segment)) {
      case 'blank_description':
        return segment as OpenapiSchemaBody

      case 'oneOf':
        return this.oneOfStatement(segment)

      case 'anyOf':
        return this.anyOfStatement(segment)

      case 'allOf':
        return this.allOfStatement(segment)

      case 'object':
        return this.objectStatement(segment as OpenapiSchemaObject)

      case 'array':
        return this.arrayStatement(segment as OpenapiSchemaArray)

      case 'openapi_primitive_literal':
        return this.primitiveLiteralStatement(segment as OpenapiShorthandPrimitiveTypes)

      case 'openapi_primitive_object':
        return this.primitiveObjectStatement(segment)

      case 'unknown_object':
        return this.unknownObjectStatement(segment)

      case undefined:
        return { type: 'object' }
    }
  }

  /**
   * Returns a type based on analysis of the segment
   */
  private segmentType(segment: OpenapiShorthandSegment) {
    if (segment === undefined) return undefined

    const objectSegment = segment as OpenapiSchemaObject
    const arraySegment = segment as OpenapiSchemaArray
    const oneOfSegment = segment as OpenapiSchemaShorthandExpressionOneOf
    const anyOfSegment = segment as OpenapiSchemaShorthandExpressionAnyOf
    const allOfSegment = segment as OpenapiSchemaShorthandExpressionAllOf

    if (isBlankDescription(segment)) return 'blank_description'
    if (oneOfSegment.oneOf) return 'oneOf'
    if (anyOfSegment.anyOf) return 'anyOf'
    if (allOfSegment.allOf) return 'allOf'
    if (this.maybeNullTypeToType(objectSegment) === 'object') return 'object'
    else if (this.maybeNullTypeToType(arraySegment) === 'array') return 'array'
    else {
      const primitiveString = maybeNullOpenapiShorthandToOpenapiShorthand(segment as OpenapiPrimitiveTypes)
      if (typeof primitiveString === 'string' && openapiShorthandPrimitiveTypes.includes(primitiveString))
        return 'openapi_primitive_literal'

      if (typeof segment === 'object') {
        if (
          openapiShorthandPrimitiveTypes.includes(
            this.maybeNullTypeToType(segment) as (typeof openapiShorthandPrimitiveTypes)[number]
          )
        )
          return 'openapi_primitive_object'
      }

      if (typeof segment === 'object') return 'unknown_object'
    }

    return undefined
  }

  private maybeNullTypeToType(segment: OpenapiShorthandSegment | OpenapiSchemaObject | OpenapiSchemaArray) {
    if (segment === undefined) return undefined
    if (typeof segment === 'string') return segment

    const safeSegment = segment as { type: OpenapiShorthandAllTypes }
    const openapiType = safeSegment.type

    if (Array.isArray(openapiType)) {
      if (openapiType[1] === 'null') return openapiType[0]
      if (openapiType[0] === 'null') return openapiType[1]
      return undefined
    } else {
      return openapiType
    }
  }

  /**
   * expands each branch of a oneOf statement
   */
  private oneOfStatement(segment: OpenapiShorthandSegment): OpenapiSchemaBody {
    const oneOfSegment = segment as OpenapiSchemaShorthandExpressionOneOf

    return {
      oneOf: oneOfSegment.oneOf.map(branch => this.expand(branch as OpenapiShorthandSegment)),
      ...this.combinatorDescriptiveFields(segment),
    } as OpenapiSchemaBody
  }

  /**
   * expands each branch of an anyOf statement
   */
  private anyOfStatement(segment: OpenapiShorthandSegment): OpenapiSchemaBody {
    const anyOfSegment = segment as OpenapiSchemaShorthandExpressionAnyOf

    return {
      anyOf: anyOfSegment.anyOf.map(branch => this.expand(branch as OpenapiShorthandSegment)),
      ...this.combinatorDescriptiveFields(segment),
    } as OpenapiSchemaBody
  }

  /**
   * expands each branch of an allOf statement
   */
  private allOfStatement(segment: OpenapiShorthandSegment): OpenapiSchemaBody {
    const allOfSegment = segment as OpenapiSchemaShorthandExpressionAllOf

    return {
      allOf: allOfSegment.allOf.map(branch => this.expand(branch as OpenapiShorthandSegment)),
      ...this.combinatorDescriptiveFields(segment),
    } as OpenapiSchemaBody
  }

  /**
   * The keys kept beside an `allOf`, `anyOf` or `oneOf`: `description` and
   * `summary`, the fields Dream's OpenAPI types allow beside a combinator.
   * Every other key beside it (`type`, `required`, `additionalProperties`,
   * `unevaluatedProperties`, …) is dropped, so no schema gains a property lock
   * here: a flattened serializer's `allOf` wrapper keeps no lock in the
   * document's components, which stay as open as every other serializer's.
   * A combinator applies to every value, `null` included, so a nullable `type`
   * beside one could never admit `null`; a combinator that may be null lists a
   * `{ type: 'null' }` branch in its `anyOf` or `oneOf` instead.
   */
  private combinatorDescriptiveFields(segment: OpenapiShorthandSegment): {
    description?: string
    summary?: string
  } {
    const { description, summary } = segment as { description?: string; summary?: string }
    return {
      ...(description ? { description } : {}),
      ...(summary ? { summary } : {}),
    }
  }

  /**
   * expands an array statement and its items
   */
  private arrayStatement(segment: OpenapiSchemaArray): OpenapiSchemaBody {
    const items = this.expand(segment.items as OpenapiShorthandSegment)

    const data = this.applyCommonFieldsToPayload<OpenapiSchemaArray>({
      type: segment.type,
      items,
    })

    const description = segment.description

    if (description) {
      data.description = description
    }

    return data
  }

  /**
   * expands an object statement, keeping only the keys an OpenAPI object
   * schema renders (`type`, `description`, `summary`, `maxProperties`,
   * `minProperties`, `additionalProperties`, `required`, `properties`)
   */
  private objectStatement(segment: OpenapiSchemaObject): OpenapiSchemaBody {
    const objectSegment = segment as OpenapiSchemaObjectBase
    const data: OpenapiSchemaObjectBase = {
      type: segment.type,
    }

    if (objectSegment.description) {
      data.description = objectSegment.description
    }

    if (objectSegment.summary) {
      data.summary = objectSegment.summary
    }

    if (objectSegment.maxProperties) {
      data.maxProperties = objectSegment.maxProperties
    }

    if (objectSegment.minProperties) {
      data.minProperties = objectSegment.minProperties
    }

    if (objectSegment.additionalProperties === false) {
      data.additionalProperties = false
    } else if (objectSegment.additionalProperties) {
      data.additionalProperties = this.expand(
        objectSegment.additionalProperties as OpenapiShorthandSegment
      ) as OpenapiSchemaObject
    }

    if (Array.isArray(objectSegment.required)) data.required = objectSegment.required

    if (objectSegment.properties) {
      data.properties = this.parseObjectPropertyStatement(
        objectSegment.properties
      ) as unknown as OpenapiSchemaProperties
    }

    return data
  }

  /**
   * expands the `properties` of an object. In OpenAPI, `properties` is always
   * a map of property names to schemas, so every key is a property name: a
   * property named `oneOf`, `anyOf` or `allOf` is expanded as a property,
   * never read as a composition (a composition written in place of the map
   * is then a property whose shape is an array, which AJV refuses)
   */
  private parseObjectPropertyStatement(
    propertySegment:
      | Record<string, OpenapiSchemaBody | OpenapiSchemaBodyShorthand>
      | OpenapiSchemaExpressionAllOf
      | OpenapiSchemaExpressionAnyOf
      | OpenapiSchemaExpressionOneOf
      | OpenapiSchemaShorthandExpressionAllOf
      | OpenapiSchemaShorthandExpressionAnyOf
      | OpenapiSchemaShorthandExpressionOneOf
  ): OpenapiSchemaBody {
    const objectSegment = propertySegment as unknown as OpenapiSchemaObjectBase
    // the expanded properties go into a new object, never back into the
    // input: the input may be a declaration on a model (`@deco.JSON`,
    // `@deco.Virtual`, `@deco.Encrypted`) or a serializer, which every later
    // render reads (and compares) as declared
    const properties: Record<string, OpenapiSchemaBody> = {}

    Object.keys(objectSegment || {}).forEach(key => {
      properties[key] = this.expand((objectSegment as any)[key])
    })

    return properties as unknown as OpenapiSchemaBody
  }

  /**
   * expands a primitive literal type (i.e. string or boolean[])
   */
  private primitiveLiteralStatement(segment: OpenapiShorthandPrimitiveTypes): OpenapiSchemaBody {
    return openapiShorthandToOpenapi(segment) as OpenapiSchemaPrimitiveGeneric
  }

  /**
   * expands a primitive object type (i.e. { type: 'string[]' })
   */
  private primitiveObjectStatement(segment: OpenapiShorthandSegment): OpenapiSchemaBody {
    const safeSegment = segment as Extract<OpenapiSchemaBase, { type: OpenapiPrimitiveTypes }>

    return this.applyConfigurationOptions(
      this.applyCommonFieldsToPayload<OpenapiSchemaPrimitiveGeneric>({
        ...safeSegment,
        ...openapiShorthandToOpenapi(safeSegment.type),
      } as OpenapiSchemaPrimitiveGeneric)
    )
  }

  private applyConfigurationOptions<T>(obj: T): T {
    const anyObj = obj as any

    if (typeof anyObj === 'object') {
      if (anyObj?.type === 'string' && this.options.suppressEnums) {
        const enums = anyObj.enum as string[] | null

        if (enums?.length) {
          delete anyObj.enum

          anyObj.description ||= `
The following values will be allowed:
  ${enums.join(',\n  ')}`
        }
      }
    }

    return anyObj as T
  }

  /**
   * returns an object the expansion does not know, with its common fields,
   * and an array it does not know (one that is not a nullable shorthand) as
   * given, never spread into an object keyed by index
   */
  private unknownObjectStatement(segment: OpenapiShorthandSegment): OpenapiSchemaBody {
    if (Array.isArray(segment)) return [...(segment as unknown[])] as unknown as OpenapiSchemaBody
    return this.applyCommonFieldsToPayload(segment as any) as OpenapiSchemaBody
  }

  /**
   * binds shared openapi fields to any object
   */
  private applyCommonFieldsToPayload<
    Obj extends OpenapiSchemaBody | OpenapiSchemaObject | OpenapiSchemaArray,
  >(obj: Obj): Obj {
    const objectCast = obj as OpenapiSchemaObject
    const returnObj: Obj = {
      ...obj,
    }

    if (objectCast.description) {
      ;(returnObj as any).description = objectCast.description
    }

    if (objectCast.summary) {
      ;(returnObj as any).summary = objectCast.summary
    }

    return returnObj
  }
}
