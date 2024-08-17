import DreamSerializer from '..'
import Dream from '../../dream'
import { RoundingPrecision } from '../../helpers/round'
import {
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiShorthandPrimitiveTypes,
} from '../../openapi/types'
import { dreamAttributeOpenApiShape } from './helpers/dreamAttributeOpenApiShape'

export default function Attribute(): any
export default function Attribute(
  manualOpenApiOptions: OpenapiSchemaBodyShorthand,
  renderOptions?: AttributeRenderOptions
): any

export default function Attribute(
  shorthandAttribute: Exclude<OpenapiShorthandPrimitiveTypes, 'decimal' | 'decimal[]'>,
  shorthandAttributeOpenApiOptions?: ShorthandAttributeOpenApiOptions | null,
  shorthandAttributeRenderOptions?: ShorthandAttributeRenderOptions
): any

export default function Attribute(
  shorthandAttribute: 'decimal' | 'decimal[]',
  shorthandAttributeOpenApiOptions?: ShorthandAttributeOpenApiOptions | null,
  shorthandAttributeRenderOptions?: DecimalAttributeRenderOptions
): any

export default function Attribute<DreamClass extends typeof Dream>(
  dreamClass: DreamClass,
  openApiOptions?: AutomaticOpenApiExtraOptions | null,
  openApiRenderOptions?: DecimalSpecificAttributeRenderOptions
): any

/*
 * Used to indicate which properties or methods on a
 * serializer should be returned when rendering this
 * serializer.
 *
 * When calling the @Attribute decorator, the first
 * argument passed is used to inform psychic of the
 * intended return shape. The api for the UserSerializer
 * class is a shorthand hybrid of the openapi spec.
 *
 * You are able to pass types directly like so:
 *
 * ```ts
 * class UserSerializer extends DreamSerializer {
 *   @Attribute('string')
 *   public email: string
 * }
 * ```
 *
 * And can also easily communicate array types:
 *
 * ```ts
 * class UserSerializer extends DreamSerializer {
 *   @Attribute('decimal[]')
 *   public scores: number[]
 * }
 * ```
 *
 * For more complex types, utilize the openapi
 * shorthand api provided by dream to communicate
 * the custom payload shape:
 *
 * ```ts
 * class UserSerializer extends DreamSerializer {
 *   @Attribute({
 *     first: 'string',
 *     last: {
 *       type: 'string',
 *       nullable: true,
 *     },
 *   })
 *   public name: { first: string; last: number | null }
 * }
 * ```
 *
 * You are able to use advanced openapi types
 * to communicate complex possibilities:
 *
 * ```ts
 * class UserSerializer extends DreamSerializer {
 *   @Attribute({
 *     anyOf: [
 *       {
 *         type: 'object',
 *         properties: {
 *           first: 'string',
 *           last: {
 *             type: 'string',
 *             nullable: true,
 *           },
 *         }
 *       },
 *       {
 *         type: 'string',
 *         nullable: true,
 *       },
 *       {
 *         $schema: 'UserName'
 *       }
 *     ]
 *   })
 *   public name: any
 * }
 * ```
 */
export default function Attribute(
  manualOpenApiOptions_or_shorthandAttribute_or_dreamClass?: unknown,
  renderOptions_or_shorthandAttributeOpenApiOptions?: unknown,
  shorthandAttributeRenderOptions_or_openApiOptions_or_openApiRenderOptions?: unknown
): any {
  return function (target: any, key: string, def: any) {
    const serializerClass: typeof DreamSerializer = target.constructor

    let renderAs: SerializableTypes
    let renderOptions: AttributeRenderOptions
    let openApiShape: OpenapiSchemaBody

    if ((manualOpenApiOptions_or_shorthandAttribute_or_dreamClass as typeof Dream)?.isDream) {
      renderAs = dreamAttributeOpenApiShape(
        manualOpenApiOptions_or_shorthandAttribute_or_dreamClass as typeof Dream,
        key
      )
    }

    serializerClass.attributeStatements = [
      ...(serializerClass.attributeStatements || []),
      // {
      //   field: key,
      //   functional: typeof def?.value === 'function',
      //   openApiShape,
      //   renderAs,
      //   renderOptions,
      // } as AttributeStatement,
    ]
  }
}

export type SerializableTypes = OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand

export interface AttributeStatement {
  field: string
  functional: boolean
  openApiShape: OpenapiSchemaBody
  renderAs?: SerializableTypes
  renderOptions?: AttributeRenderOptions
}

interface AutomaticOpenApiExtraOptions {
  description?: string
}

interface ShorthandAttributeOpenApiOptions extends AutomaticOpenApiExtraOptions {
  nullable?: boolean
}

interface ShorthandAttributeRenderOptions {
  delegate?: string
}

interface DecimalSpecificAttributeRenderOptions {
  precision?: RoundingPrecision
}

type DecimalAttributeRenderOptions = ShorthandAttributeRenderOptions & DecimalSpecificAttributeRenderOptions

type AttributeRenderOptions = DecimalAttributeRenderOptions
