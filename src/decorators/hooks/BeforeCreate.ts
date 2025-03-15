import Dream from '../../Dream.js.js'
import { DecoratorContext } from '../DecoratorContextType.js.js'
import { BeforeHookOpts, HookStatement, blankHooksFactory } from './shared.js.js'

export default function BeforeCreate<T extends Dream>(opts: BeforeHookOpts<T> = {}): any {
  return function (_: any, context: DecoratorContext) {
    context.addInitializer(function (this: T) {
      beforeCreateImplementation(this, context.name, opts)
    })
  }
}

export function beforeCreateImplementation<T extends Dream>(
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
    type: 'beforeCreate',
    ifChanging: opts.ifChanging,
  }

  dreamClass['addHook']('beforeCreate', hookStatement)
}
