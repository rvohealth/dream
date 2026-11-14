import Dream from '../../Dream.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../../types/openapi.js'
import { DecoratorContext } from '../DecoratorContextType.js'
import registerOnce from '../helpers/registerOnce.js'

export default function Virtual(type: OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: Dream) {
      const t: typeof Dream = this.constructor as typeof Dream
      if (!t['globallyInitializingDecorators']) return

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

export interface VirtualAttributeStatement {
  property: string
  type: OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand | undefined
}
