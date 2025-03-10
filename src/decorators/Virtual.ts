import Dream from '../Dream.js'
import { SerializableTypes } from '../serializer/decorators/attribute.js'
import { DecoratorContext } from './DecoratorContextType.js'

export default function Virtual(type?: SerializableTypes): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: Dream) {
      const t: typeof Dream = this.constructor as typeof Dream
      if (!t['globallyInitializingDecorators']) return

      if (!Object.getOwnPropertyDescriptor(t, 'virtualAttributes'))
        t['virtualAttributes'] = [...t['virtualAttributes']]
      ;(t['virtualAttributes'] as VirtualAttributeStatement[]).push({
        property: key,
        type,
      } satisfies VirtualAttributeStatement)
    })

    return function (this: Dream) {
      return (this as any)[key]
    }
  }
}

export interface VirtualAttributeStatement {
  property: string
  type?: SerializableTypes
}
