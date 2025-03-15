import Dream from '../../Dream.js'
import { DecoratorContext } from '../DecoratorContextType.js'
import { AfterHookOpts, HookStatement, blankHooksFactory } from './shared.js'

/**
 * Calls the decorated method whenever a dream has finished
 * being created. If the save takes place within a transaction,
 * this method will not be called until the transaction is
 * committed. However, if the save is not taking place in
 * a transaction, the method will be run after the save
 * is complete.
 *
 * class User extends ApplicationModel {
 *   @Deco.AfterCreateCommit()
 *   public doSomething() {
 *     ...
 *   }
 * }
 *
 * @param opts.ifChanged - Optional. A list of columns which should must change in order for this function to be called.
 */

export default function AfterCreateCommit<T extends Dream>(opts: AfterHookOpts<T> = {}): any {
  return function (_: any, context: DecoratorContext) {
    context.addInitializer(function (this: T) {
      afterCreateCommitImplementation(this, context.name, opts)
    })
  }
}

export function afterCreateCommitImplementation<T extends Dream>(
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
    type: 'afterCreateCommit',
    ifChanged: opts.ifChanged,
  }

  dreamClass['addHook']('afterCreateCommit', hookStatement)
}
