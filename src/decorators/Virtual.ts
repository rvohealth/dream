import Dream from '../Dream.js'
import { SerializableTypes } from '../serializer/decorators/attribute.js'
import { DecoratorContext } from './DecoratorContextType.js'

export default function Virtual(type?: SerializableTypes): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: Dream) {
      const t: typeof Dream = this.constructor as typeof Dream
      if (!t['globallyInitializingDecorators']) {
        if (context.kind !== 'getter') {
          delete (this as any)[key]
        }
        return
      }

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

      // if (context.kind === 'field') {
      // }
    })

    if (context.kind === 'field') {
      return function (this: Dream) {
        return (this as any)[key]
      }
    } else if (context.kind === 'getter') {
      return function (this: Dream) {
        return (this as any)['initialVirtualColumnValues'][key]
      }
      //   console.log((this as any).getAttributes(), 'HAMSANDO')
      //   return (this as any).getAttributes()[key]
      //   // delete this[key]
      //   // return context.access.get.bind(this).apply(this)
      //   console.debug(Object.getOwnPropertyDescriptor(this, key))
      //   console.debug(Object.getPrototypeOf(this)[key], this.constructor.name)
      //   return Object.getPrototypeOf(this)[key]
      //   // return this[key]
      // }
      // return context.access.get
      // return function (this: Dream) {
      //   return context.access.get.call(this)
      // }
    }
  }
}

export interface VirtualAttributeStatement {
  property: string
  type?: SerializableTypes
}
