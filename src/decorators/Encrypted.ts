import Dream from '../Dream.js'
import pascalize from '../helpers/pascalize.js'
import { DecoratorContext } from './DecoratorContextType.js'

export default function Encrypted(encryptedColumnName?: string): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: Dream) {
      const t: typeof Dream = this.constructor as typeof Dream
      if (!t['globallyInitializingDecorators']) {
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

      if (!Object.getOwnPropertyDescriptor(t, 'encryptedAttributes'))
        t['encryptedAttributes'] = [...(t['encryptedAttributes'] || [])]

      t['encryptedAttributes'].push({
        property: key,
        encryptedColumnName: encryptedColumnName || `encrypted${pascalize(key)}`,
      })
    })

    return function (this: Dream) {
      return (this as any)[key]
    }
  }
}

export interface EncryptedAttributeStatement {
  property: string
  encryptedColumnName: string
}
