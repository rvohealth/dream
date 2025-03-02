import Dream from '../../Dream'
import { DecoratorContext } from '../DecoratorContextType'
import { BeforeHookOpts, HookStatement, blankHooksFactory } from './shared'

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
  if (!dreamClass.initializingDecorators) return

  if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
    dreamClass['hooks'] = blankHooksFactory(dreamClass)

  const hookStatement: HookStatement = {
    className: dreamClass.name,
    method: key,
    type: 'beforeCreate',
    ifChanging: opts.ifChanging,
  }

  dreamClass['addHook']('beforeCreate', hookStatement)
}
