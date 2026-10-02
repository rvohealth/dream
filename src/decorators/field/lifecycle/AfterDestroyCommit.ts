import Dream from '../../../Dream.js'
import { CommitHookDecorator, HookStatement } from '../../../types/lifecycle.js'
import { DecoratorContext } from '../../DecoratorContextType.js'
import { blankHooksFactory } from './shared.js'

/**
 * Calls the decorated method whenever a dream has finished
 * being destroyed. If the destroy takes place within a transaction,
 * this method will not be called until the transaction is
 * committed. However, if the destroy is not taking place in
 * a transaction, the method will be run after the save
 * is complete.
 *
 * The method is called with no argument: the transaction has already
 * committed, so there is none to hand it. Decorating a method that
 * declares a parameter is a compile error (see {@link CommitHookDecorator}).
 *
 * class User extends ApplicationModel {
 *   @deco.AfterDestroyCommit()
 *   public doSomething() {
 *     ...
 *   }
 * }
 */

export default function AfterDestroyCommit(): CommitHookDecorator {
  return function (_: any, context: DecoratorContext) {
    context.addInitializer(function (this: Dream) {
      afterDestroyCommitImplementation(this, context.name)
    })
  } as CommitHookDecorator
}

export function afterDestroyCommitImplementation<T extends Dream>(target: T, key: string) {
  const dreamClass: typeof Dream = target.constructor as typeof Dream
  if (!dreamClass['globallyInitializingDecorators']) return

  if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
    dreamClass['hooks'] = blankHooksFactory(dreamClass)

  const hookStatement: HookStatement = {
    className: dreamClass.sanitizedName,
    method: key,
    type: 'afterDestroyCommit',
  }

  dreamClass['addHook']('afterDestroyCommit', hookStatement)
}
