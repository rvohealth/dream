import Dream from '../../Dream'
import { DecoratorContext } from '../DecoratorContextType'
import { AfterHookOpts, HookStatement, blankHooksFactory } from './shared'

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
  if (!dreamClass.initializingDecorators) return

  if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
    dreamClass['hooks'] = blankHooksFactory(dreamClass)

  const hookStatement: HookStatement = {
    className: dreamClass.name,
    method: key,
    type: 'afterCreate',
    ifChanged: opts.ifChanged,
  }

  dreamClass['addHook']('afterCreate', hookStatement)
}
