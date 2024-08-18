import DreamSerializer from '..'
import Dream from '../../dream'
import { RoundingPrecision } from '../../helpers/round'
import { isString } from '../../helpers/typechecks'
import {
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiShorthandPrimitiveTypes,
} from '../../openapi/types'
import { dreamAttributeOpenapiShape } from './helpers/dreamAttributeOpenapiShape2'

export default function Attribute(): any

export default function Attribute<DreamClass extends typeof Dream>(
  dreamClass: DreamClass,
  openApiAndRenderOptions?: AutomaticOpenapiAndREnderOptions
): any

export default function Attribute(
  manualOpenapiOptions: OpenapiSchemaBodyShorthand,
  renderOptions?: DecimalShorthandAttributeRenderOptions
): any

export default function Attribute(
  shorthandAttribute: 'decimal' | 'decimal[]',
  openApiAndRenderOptions?: DecimalShorthandAttributeOpenapiAndRenderOptions
): any

export default function Attribute(
  shorthandAttribute: OpenapiShorthandPrimitiveTypes,
  openApiAndRenderOptions?: ShorthandAttributeOpenapiAndRenderOptions
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
  dreamClass_or_shorthandAttribute_or_manualOpenapiOptions?: unknown,
  openApiAndRenderOptions_or_renderOptions: unknown = {}
): any {
  return function (target: any, key: string, def: any) {
    const serializerClass: typeof DreamSerializer = target.constructor

    let renderAs: SerializableTypes | undefined
    let openApiShape: OpenapiSchemaBodyShorthand | undefined
    const { openApiOptions, renderOptions } = openApiAndRenderOptionsToSeparateOptions(
      openApiAndRenderOptions_or_renderOptions as DecimalShorthandAttributeOpenapiAndRenderOptions
    )

    if ((dreamClass_or_shorthandAttribute_or_manualOpenapiOptions as typeof Dream)?.isDream) {
      openApiShape = {
        ...dreamAttributeOpenapiShape(
          dreamClass_or_shorthandAttribute_or_manualOpenapiOptions as typeof Dream,
          key
        ),
        ...openApiOptions,
      }

      //
    } else if (isString(dreamClass_or_shorthandAttribute_or_manualOpenapiOptions)) {
      renderAs = dreamClass_or_shorthandAttribute_or_manualOpenapiOptions as OpenapiShorthandPrimitiveTypes
      openApiShape = { type: renderAs, ...openApiOptions }
      //
    } else if (typeof dreamClass_or_shorthandAttribute_or_manualOpenapiOptions === 'object') {
      openApiShape = dreamClass_or_shorthandAttribute_or_manualOpenapiOptions as OpenapiSchemaBodyShorthand
      renderAs = openApiShape
    } else if (dreamClass_or_shorthandAttribute_or_manualOpenapiOptions === undefined) {
      // no-op
    } else {
      throw new Error(
        `Unrecognized first argument to @Attriute decorator: ${JSON.stringify(dreamClass_or_shorthandAttribute_or_manualOpenapiOptions)}`
      )
    }

    serializerClass.attributeStatements = [
      ...(serializerClass.attributeStatements || []),
      {
        field: key,
        functional: typeof def?.value === 'function',
        openApiShape,
        renderAs,
        renderOptions,
      } as AttributeStatement,
    ]
  }
}

function openApiAndRenderOptionsToSeparateOptions(
  openApiAndRenderOptions: DecimalShorthandAttributeOpenapiAndRenderOptions
): { openApiOptions: OpenapiOnlyOptions | undefined; renderOptions: RenderOnlyOptions | undefined } {
  let openApiOptions: OpenapiOnlyOptions | undefined
  let renderOptions: RenderOnlyOptions | undefined

  if (openApiAndRenderOptions.description !== undefined) {
    openApiOptions ||= {}
    openApiOptions.description = openApiAndRenderOptions.description
  }

  if (openApiAndRenderOptions.nullable !== undefined) {
    openApiOptions ||= {}
    openApiOptions.nullable = openApiAndRenderOptions.nullable
  }

  if (openApiAndRenderOptions.delegate !== undefined) {
    renderOptions ||= {}
    renderOptions.delegate = openApiAndRenderOptions.delegate
  }

  if (openApiAndRenderOptions.precision !== undefined) {
    renderOptions ||= {}
    renderOptions.precision = openApiAndRenderOptions.precision
  }

  return { openApiOptions, renderOptions }
}

export type SerializableTypes = OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand

export interface AttributeStatement {
  field: string
  functional: boolean
  openApiShape: OpenapiSchemaBody
  renderAs?: SerializableTypes
  renderOptions?: AttributeRenderOptions
}

interface AttributeRenderOptions {
  delegate?: string
  precision?: RoundingPrecision
}

interface OpenapiOnlyOptions {
  nullable?: boolean
  description?: string
}

interface RenderOnlyOptions {
  precision?: RoundingPrecision
  delegate?: string
}

type AutomaticOpenapiAndREnderOptions = Pick<OpenapiOnlyOptions, 'description'> &
  Pick<RenderOnlyOptions, 'precision'>

type ShorthandAttributeOpenapiAndRenderOptions = Pick<OpenapiOnlyOptions, 'nullable' | 'description'> &
  Pick<RenderOnlyOptions, 'delegate'>

type DecimalShorthandAttributeRenderOptions = Pick<RenderOnlyOptions, 'precision'>

type DecimalShorthandAttributeOpenapiAndRenderOptions = ShorthandAttributeOpenapiAndRenderOptions &
  DecimalShorthandAttributeRenderOptions
