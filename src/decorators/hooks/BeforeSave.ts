import Dream from '../../Dream'
import { DecoratorContext } from '../DecoratorContextType'
import { BeforeHookOpts, HookStatement, blankHooksFactory } from './shared'

export default function BeforeSave<T extends Dream>(opts: BeforeHookOpts<T> = {}): any {
  return function (_: any, context: DecoratorContext) {
    context.addInitializer(function (this: T) {
      beforeSaveImplementation(this, context.name, opts)
    })
  }
}

export function beforeSaveImplementation<T extends Dream>(
  target: T,
  key: string,
  opts: BeforeHookOpts<T> = {}
) {
  const dreamClass: typeof Dream = target.constructor as typeof Dream
  if (!dreamClass['globallyInitializingDecorators']) return

  if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
    dreamClass['hooks'] = blankHooksFactory(dreamClass)

  const hookStatement: HookStatement = {
    className: dreamClass.name,
    method: key,
    type: 'beforeSave',
    ifChanging: opts.ifChanging,
  }

  dreamClass['addHook']('beforeSave', hookStatement)
}
