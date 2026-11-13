import Dream from '../../Dream.js'
import { DecoratorContext } from '../DecoratorContextType.js'

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

      // an STI child inherits its base's `customValidations` via the copy above,
      // and the base's method initializers run again while the child is globally
      // initialized, so a method already registered is skipped rather than run
      // twice on each validation
      if (t['customValidations'].includes(key)) return
      ;(t['customValidations'] as string[]).push(key)
    })
  }
}
