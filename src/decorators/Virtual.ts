import Dream from '../Dream'
import { SerializableTypes } from '../serializer/decorators/attribute'
import { DecoratorContext } from './DecoratorContextType'

export default function Virtual(type?: SerializableTypes): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: Dream) {
      const t: typeof Dream = this.constructor as typeof Dream
      if (!t.initializingDecorators) return

      if (!Object.getOwnPropertyDescriptor(t, 'virtualAttributes'))
        t['virtualAttributes'] = [...(t['virtualAttributes'] || [])]

      t['virtualAttributes'].push({
        property: key,
        type,
      } as VirtualAttributeStatement)
    })

    return function (this: Dream) {
      return this[key]
    }
  }
}

export interface VirtualAttributeStatement {
  property: string
  type?: SerializableTypes
}
