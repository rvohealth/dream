import Dream from '../../../Dream.js'
import { AfterHookOpts, HookStatement } from '../../../types/lifecycle.js'
import { DecoratorContext } from '../../DecoratorContextType.js'
import { blankHooksFactory } from './shared.js'

export default function AfterSave<T extends Dream>(opts: AfterHookOpts<T> = {}): any {
  return function (_: any, context: DecoratorContext) {
    context.addInitializer(function (this: T) {
      afterSaveImplementation(this, context.name, opts)
    })
  }
}

export function afterSaveImplementation<T extends Dream>(
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
    type: 'afterSave',
    ifChanged: opts.ifChanged,
  }

  dreamClass['addHook']('afterSave', hookStatement)
}
