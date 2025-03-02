import Dream from '../../Dream'
import { DecoratorContext } from '../DecoratorContextType'
import { HookStatement, blankHooksFactory } from './shared'

export default function BeforeDestroy(): any {
  return function (_: any, context: DecoratorContext) {
    context.addInitializer(function (this: Dream) {
      beforeDestroyImplementation(this, context.name)
    })
  }
}

export function beforeDestroyImplementation(target: Dream, key: string) {
  const dreamClass: typeof Dream = target.constructor as typeof Dream
  if (!dreamClass.initializingDecorators) return

  if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
    dreamClass['hooks'] = blankHooksFactory(dreamClass)

  const hookStatement: HookStatement = {
    className: dreamClass.name,
    method: key,
    type: 'beforeDestroy',
  }

  dreamClass['addHook']('beforeDestroy', hookStatement)
}
