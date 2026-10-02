import Dream from '../../../Dream.js'
import { AfterHookOpts, CommitHookDecorator, HookStatement } from '../../../types/lifecycle.js'
import { DecoratorContext } from '../../DecoratorContextType.js'
import { blankHooksFactory } from './shared.js'

/**
 * Calls the decorated method whenever a dream has finished
 * being updated. If the save takes place within a transaction,
 * this method will not be called until the transaction is
 * committed. However, if the save is not taking place in
 * a transaction, the method will be run after the save
 * is complete.
 *
 * The method is called with no argument: the transaction has already
 * committed, so there is none to hand it. Decorating a method that
 * declares a parameter is a compile error (see {@link CommitHookDecorator}).
 *
 * class User extends ApplicationModel {
 *   @deco.AfterUpdateCommit()
 *   public doSomething() {
 *     ...
 *   }
 * }
 *
 * @param opts.ifChanged - Optional. A list of columns which should must change in order for this function to be called.
 */

export default function AfterUpdateCommit<T extends Dream>(opts: AfterHookOpts<T> = {}): CommitHookDecorator {
  return function (_: any, context: DecoratorContext) {
    context.addInitializer(function (this: T) {
      afterUpdateCommitImplementation(this, context.name, opts)
    })
  } as CommitHookDecorator
}

export function afterUpdateCommitImplementation<T extends Dream>(
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
    type: 'afterUpdateCommit',
    ifChanged: opts.ifChanged,
  }

  dreamClass['addHook']('afterUpdateCommit', hookStatement)
}
