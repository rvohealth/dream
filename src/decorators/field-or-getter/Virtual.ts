import Dream from '../../Dream.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../../types/openapi.js'
import { DecoratorContext } from '../DecoratorContextType.js'

export default function Virtual(type: OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: Dream) {
      const t: typeof Dream = this.constructor as typeof Dream
      if (!t['globallyInitializingDecorators']) return

      if (!Object.getOwnPropertyDescriptor(t, 'virtualAttributes')) {
        // This pattern allows `virtualAttributes` on a base STI class and on
        // child STI classes. The new `virtualAttributes` property will be created
        // on the child STI class, but it will include all the `virtualAttributes`
        // already declared on the base STI class.
        t['virtualAttributes'] = [...t['virtualAttributes']]
      }
      ;(t['virtualAttributes'] as VirtualAttributeStatement[]).push({
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
