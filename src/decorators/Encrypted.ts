import Dream from '../Dream'
import pascalize from '../helpers/pascalize'
import { DecoratorContext } from './DecoratorContextType'

export default function Encrypted(encryptedColumnName?: string): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: Dream) {
      const t: typeof Dream = this.constructor as typeof Dream
      if (!t['globallyInitializingDecorators']) {
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
