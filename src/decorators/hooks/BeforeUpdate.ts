import Dream from '../../Dream.js'
import { DecoratorContext } from '../DecoratorContextType.js'
import { BeforeHookOpts, HookStatement, blankHooksFactory } from './shared.js'

export default function BeforeUpdate<T extends Dream>(opts: BeforeHookOpts<T> = {}): any {
  return function (_: any, context: DecoratorContext) {
    context.addInitializer(function (this: T) {
      beforeUpdateImplementation(this, context.name, opts)
    })
  }
}

export function beforeUpdateImplementation<T extends Dream>(
  target: T,
  key: string,
  opts: BeforeHookOpts<T> = {}
) {
  const dreamClass: typeof Dream = target.constructor as typeof Dream
  if (!dreamClass['globallyInitializingDecorators']) return

  if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
    dreamClass['hooks'] = blankHooksFactory(dreamClass)

  const hookStatement: HookStatement = {
    className: dreamClass.sanitizedName,
    method: key,
    type: 'beforeUpdate',
    ifChanging: opts.ifChanging,
  }

  dreamClass['addHook']('beforeUpdate', hookStatement)
}
