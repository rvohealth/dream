import Dream from '../../Dream.js.js'
import { DecoratorContext } from '../DecoratorContextType.js.js'

export default function Validate(): any {
  return function (target: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: Dream) {
      const t: typeof Dream = this.constructor as typeof Dream
      if (!t['globallyInitializingDecorators']) return

      if (!Object.getOwnPropertyDescriptor(t, 'customValidations')) {
        // This pattern allows `customValidations` on a base STI class and on
        // child STI classes. The new `customValidations` property will be created
        // on the child STI class, but it will include all the `customValidations`
        // already declared on the base STI class.
        t['customValidations'] = [...t['customValidations']]
      }
      ;(t['customValidations'] as string[]).push(key)
    })
  }
}
