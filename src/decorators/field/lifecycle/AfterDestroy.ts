import Dream from '../../../Dream.js'
import { HookStatement } from '../../../types/lifecycle.js'
import { DecoratorContext } from '../../DecoratorContextType.js'
import { blankHooksFactory } from './shared.js'

export default function AfterDestroy(): any {
  return function (_: any, context: DecoratorContext) {
    context.addInitializer(function (this: Dream) {
      afterDestroyImplementation(this, context.name)
    })
  }
}

export function afterDestroyImplementation(target: Dream, key: string) {
  const dreamClass: typeof Dream = target.constructor as typeof Dream
  if (!dreamClass['globallyInitializingDecorators']) return

  if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
    dreamClass['hooks'] = blankHooksFactory(dreamClass)

  const hookStatement: HookStatement = {
    className: dreamClass.sanitizedName,
    method: key,
    type: 'afterDestroy',
  }

  dreamClass['addHook']('afterDestroy', hookStatement)
}
