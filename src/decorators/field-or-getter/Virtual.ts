import Dream from '../../Dream.js'
import ModelDeclaredShapeContainsReference from '../../errors/ModelDeclaredShapeContainsReference.js'
import { OpenapiSchemaBodyShorthandWithoutRefs, OpenapiShorthandPrimitiveTypes } from '../../types/openapi.js'
import { DecoratorContext } from '../DecoratorContextType.js'
import findOpenapiShapeReference from '../helpers/findOpenapiShapeReference.js'
import registerOnce from '../helpers/registerOnce.js'

export default function Virtual(type: VirtualAttributeShape): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: Dream) {
      const t: typeof Dream = this.constructor as typeof Dream
      if (!t['globallyInitializingDecorators']) return

      const reference = findOpenapiShapeReference(type)
      if (reference)
        throw new ModelDeclaredShapeContainsReference(t, '@deco.Virtual', key, reference.key, reference.path)

      registerOnce(t, 'virtualAttributes', {
        property: key,
        type,
      } satisfies VirtualAttributeStatement)
    })

    if (context.kind === 'field') {
      return function (this: Dream) {
        return (this as any)[key]
      }
    }
  }
}

/**
 * The shape `@deco.Virtual` (and `@deco.Encrypted`'s `openapi` option)
 * declares: any OpenAPI shape, shorthand allowed, without a reference.
 */
export type VirtualAttributeShape = OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthandWithoutRefs

export interface VirtualAttributeStatement {
  property: string
  type: VirtualAttributeShape | undefined
}
