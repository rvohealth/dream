import { DecoratorContext } from '../../decorators/DecoratorContextType.js'
import Dream from '../../Dream.js'
import { RoundingPrecision } from '../../helpers/round.js'
import { isObject, isString } from '../../helpers/typechecks.js'
import {
  OpenapiSchemaBodyShorthand,
  OpenapiShorthandPrimitiveBaseTypes,
  OpenapiShorthandPrimitiveTypes,
} from '../../types/openapi.js'
import DreamSerializer from '../index.js'
import { dreamAttributeOpenapiShape } from './helpers/dreamAttributeOpenapiShape.js'

export default function Attribute(): any

export default function Attribute(
  manualOpenapiOptions: OpenapiSchemaBodyShorthand,
  renderOptions?: AttributeRenderOptions
): any

export default function Attribute<DreamClass extends typeof Dream>(
  dreamClass: DreamClass,
  openApiAndRenderOptions?: AutomaticOpenapiAndRenderOptions
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
 *     last: ['string', 'null'],
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
 *           last: ['string', 'null'],
 *         }
 *       },
 *       {
 *         type: ['string', 'null'],
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
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: DreamSerializer) {
      const target = this
      const serializerClass: typeof DreamSerializer = target.constructor as typeof DreamSerializer
      if (!serializerClass['globallyInitializingDecorators']) {
        /**
         * Modern Javascript applies implicit accessors to instance properties
         * that don't have an accessor explicitly defined in the class definition.
         * The instance accessors shadow prototype accessors.
         * `addInitializer` is called by Decorators after an instance has been fully
         * constructed. We leverage this opportunity to delete the instance accessors
         * so that the prototype accessors applied by this decorator can be reached.
         */
        delete (this as any)[key]
        return
      }

      let renderAs: OpenapiShorthandPrimitiveBaseTypes | undefined
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
        renderAs = (openApiShape as any).format || maybeNullPrimitiveToPrimitive((openApiShape as any)?.type)

        //
      } else if (
        isString(
          maybeNullPrimitiveToPrimitive(
            dreamClass_or_shorthandAttribute_or_manualOpenapiOptions as OpenapiShorthandPrimitiveTypes
          )
        )
      ) {
        openApiShape = {
          type: dreamClass_or_shorthandAttribute_or_manualOpenapiOptions as OpenapiShorthandPrimitiveTypes,
          ...openApiOptions,
        }
        renderAs = maybeNullPrimitiveToPrimitive(
          dreamClass_or_shorthandAttribute_or_manualOpenapiOptions as OpenapiShorthandPrimitiveTypes
        )
        //
      } else if (isObject(dreamClass_or_shorthandAttribute_or_manualOpenapiOptions)) {
        openApiShape = dreamClass_or_shorthandAttribute_or_manualOpenapiOptions as OpenapiSchemaBodyShorthand
        renderAs = (openApiShape as any).format || maybeNullPrimitiveToPrimitive((openApiShape as any)?.type)
        //
      } else if (dreamClass_or_shorthandAttribute_or_manualOpenapiOptions === undefined) {
        // no-op
      } else {
        throw new Error(
          `
Unrecognized first argument to @Attriute decorator: ${JSON.stringify(dreamClass_or_shorthandAttribute_or_manualOpenapiOptions)}
Serializer: ${serializerClass.name}
Attribute: ${key}
`
        )
      }

      serializerClass.attributeStatements = [
        ...(serializerClass.attributeStatements || []),
        {
          field: key,
          functional: context.kind === 'method',
          openApiShape,
          renderAs,
          renderOptions,
        } as AttributeStatement,
      ]
    })
  }
}

function maybeNullPrimitiveToPrimitive(
  openapiType: OpenapiShorthandPrimitiveTypes
): OpenapiShorthandPrimitiveBaseTypes {
  if (Array.isArray(openapiType)) {
    if (openapiType[1] === 'null') return openapiType[0]
    if (openapiType[0] === 'null') return openapiType[1]
    throw new Error(
      `Expected array with 'null' and an OpenAPI primitive string: ${JSON.stringify(openapiType)}`
    )
  } else {
    return openapiType
  }
}

function openApiAndRenderOptionsToSeparateOptions(
  openApiAndRenderOptions: DecimalShorthandAttributeOpenapiAndRenderOptions
): { openApiOptions: OpenapiOnlyOptions | undefined; renderOptions: AttributeRenderOptions | undefined } {
  let openApiOptions: OpenapiOnlyOptions | undefined
  let renderOptions: AttributeRenderOptions | undefined

  if (openApiAndRenderOptions.description !== undefined) {
    openApiOptions ||= {}
    openApiOptions.description = openApiAndRenderOptions.description
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
  openApiShape: OpenapiSchemaBodyShorthand
  renderAs?: OpenapiShorthandPrimitiveBaseTypes
  renderOptions?: AttributeRenderOptions
}
interface OpenapiOnlyOptions {
  description?: string
}

interface AttributeRenderOptions {
  delegate?: string
  precision?: RoundingPrecision
}

type AutomaticOpenapiAndRenderOptions = Pick<OpenapiOnlyOptions, 'description'> &
  Pick<AttributeRenderOptions, 'precision'>

type ShorthandAttributeOpenapiAndRenderOptions = Pick<OpenapiOnlyOptions, 'description'> &
  Pick<AttributeRenderOptions, 'delegate'>

type DecimalShorthandAttributeRenderOptions = Pick<AttributeRenderOptions, 'precision'>

type DecimalShorthandAttributeOpenapiAndRenderOptions = ShorthandAttributeOpenapiAndRenderOptions &
  DecimalShorthandAttributeRenderOptions
