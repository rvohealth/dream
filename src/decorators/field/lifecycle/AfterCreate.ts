import Dream from '../../../Dream.js'
import { AfterHookOpts, HookStatement } from '../../../types/lifecycle.js'
import { DecoratorContext } from '../../DecoratorContextType.js'
import { blankHooksFactory } from './shared.js'

export default function AfterCreate<T extends Dream>(opts: AfterHookOpts<T> = {}): any {
  return function (_: any, context: DecoratorContext) {
    context.addInitializer(function (this: T) {
      afterCreateImplementation(this, context.name, opts)
    })
  }
}

export function afterCreateImplementation<T extends Dream>(
  target: T,
  key: string,
  opts: AfterHookOpts<T> = {}
) {
  const dreamClass: typeof Dream = target.constructor as typeof Dream
  if (!dreamClass['globallyInitializingDecorators']) return

  if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
    dreamClass['hooks'] = blankHooksFactory(dreamClass)

  const hookStatement: HookStatement = {
    className: dreamClass.sanitizedName,
    method: key,
    type: 'afterCreate',
    ifChanged: opts.ifChanged,
  }

  dreamClass['addHook']('afterCreate', hookStatement)
}
