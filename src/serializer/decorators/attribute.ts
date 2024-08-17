import DreamSerializer from '..'
import Dream from '../../dream'
import { DreamColumnNames } from '../../dream/types'
import { RoundingPrecision } from '../../helpers/round'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../../openapi/types'

export default function Attribute(): any
export default function Attribute(
  manualOpenApiOptions: OpenapiSchemaBodyShorthand,
  renderOptions: AttributeRenderOptions
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
  dreamColumn: DreamColumnNames<InstanceType<DreamClass>>,
  openApiOptions?: AutomaticOpenApiExtraOptions
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
  renderOptions_or_shorthandAttributeOpenApiOptions_or_dreamColumn?: unknown,
  shorthandAttributeRenderOptions_or_openApiOptions?: unknown
): any {
  return function (target: any, key: string, def: any) {
    const serializerClass: typeof DreamSerializer = target.constructor
    // if (!Object.getOwnPropertyDescriptor(serializerClass, 'attributeStatements'))
    //   serializerClass.attributeStatements = [
    //     // ...(serializerClass.attributeStatements || []),
    //   ] as AttributeStatement[]

    serializerClass.attributeStatements = [
      ...(serializerClass.attributeStatements || []),
      {
        field: key,
        functional: typeof def?.value === 'function',
        renderAs,
        options,
      } as AttributeStatement,
    ]
  }
}

export type SerializableTypes = OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand

export interface AttributeStatement {
  field: string
  functional: boolean
  renderAs?: SerializableTypes
  options?: AttributeRenderOptions
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

interface DecimalAttributeRenderOptions extends ShorthandAttributeRenderOptions {
  precision?: RoundingPrecision
}

type AttributeRenderOptions = DecimalAttributeRenderOptions
