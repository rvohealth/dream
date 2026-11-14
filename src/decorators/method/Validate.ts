import Dream from '../../Dream.js'
import { DecoratorContext } from '../DecoratorContextType.js'
import registerOnce from '../helpers/registerOnce.js'

export default function Validate(): any {
  return function (target: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: Dream) {
      const t: typeof Dream = this.constructor as typeof Dream
      if (!t['globallyInitializingDecorators']) return

      registerOnce(t, 'customValidations', key)
    })
  }
}
