import Dream from '../../Dream.js'
import { DecoratorContext } from '../DecoratorContextType.js'
import { AfterHookOpts, HookStatement, blankHooksFactory } from './shared.js'

export default function AfterUpdate<T extends Dream>(opts: AfterHookOpts<T> = {}): any {
  return function (_: any, context: DecoratorContext) {
    context.addInitializer(function (this: T) {
      afterUpdateImplementation(this, context.name, opts)
    })
  }
}

export function afterUpdateImplementation<T extends Dream>(
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
    type: 'afterUpdate',
    ifChanged: opts.ifChanged,
  }

  dreamClass['addHook']('afterUpdate', hookStatement)
}
