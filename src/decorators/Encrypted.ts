import Dream from '../Dream.js'
import InternalEncrypt from '../encrypt/InternalEncrypt.js'
import DoNotSetEncryptedFieldsDirectly from '../errors/DoNotSetEncryptedFieldsDirectly.js'
import pascalize from '../helpers/pascalize.js'
import { DecoratorContext } from './DecoratorContextType.js'
import { VirtualAttributeStatement } from './Virtual.js'

export default function Encrypted(encryptedColumnName?: string): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name
    const encryptedKey = encryptedColumnName || `encrypted${pascalize(key)}`

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

      if (!Object.getOwnPropertyDescriptor(t, 'virtualAttributes'))
        t['virtualAttributes'] = [...t['virtualAttributes']]
      ;(t['virtualAttributes'] as VirtualAttributeStatement[]).push({
        property: key,
        type: 'string',
      } satisfies VirtualAttributeStatement)

      if (!Object.getOwnPropertyDescriptor(t, 'explicitUnsafeParamColumns'))
        t['explicitUnsafeParamColumns'] = [...t['explicitUnsafeParamColumns']]
      ;(t['explicitUnsafeParamColumns'] as string[]).push(encryptedKey)

      const dreamPrototype = Object.getPrototypeOf(this)

      Object.defineProperty(dreamPrototype, key, {
        get() {
          return InternalEncrypt.decryptColumn(this.getAttribute(encryptedKey))
        },

        set(val: any) {
          /**
           *
           * Modern Javascript sets all properties that do not have an explicit
           * assignment within the constructor to undefined in an implicit constructor.
           * Since the Dream constructor sets the value of properties of instances of
           * classes that extend Dream (e.g. when passing attributes to #new or #create
           * or when loading a model via one of the #find methods or #all), we need to
           * prevent those properties from being set back to undefined. Since all
           * properties corresponding to a database column get a setter, we achieve this
           * protection by including a guard in the setters that returns if this
           * property is set.
           *
           */
          if (this.columnSetterGuardActivated) return
          this.setAttribute(encryptedKey, InternalEncrypt.encryptColumn(val))
        },

        configurable: false,
        enumerable: false,
      })

      Object.defineProperty(dreamPrototype, encryptedKey, {
        get() {
          return this.currentAttributes[encryptedKey]
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        set(_: any) {
          throw new DoNotSetEncryptedFieldsDirectly(t, encryptedKey, key)
        },

        configurable: false,
        enumerable: false,
      })
    })
  }
}

export interface EncryptedAttributeStatement {
  property: string
  encryptedColumnName: string
}
