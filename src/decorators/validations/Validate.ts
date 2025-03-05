import Dream from '../../Dream'
import { DecoratorContext } from '../DecoratorContextType'

export default function Validate(): any {
  return function (target: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: Dream) {
      const t: typeof Dream = this.constructor as typeof Dream
      if (!t['globallyInitializingDecorators']) return

      if (!Object.getOwnPropertyDescriptor(t, 'customValidations'))
        t['customValidations'] = [...(t['customValidations'] || [])] as string[]

      t['customValidations'].push(key)
    })
  }
}
