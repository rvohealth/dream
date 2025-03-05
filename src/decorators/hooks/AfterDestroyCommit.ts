import Dream from '../../Dream'
import { DecoratorContext } from '../DecoratorContextType'
import { HookStatement, blankHooksFactory } from './shared'

/**
 * Calls the decorated method whenever a dream has finished
 * being destroyed. If the destroy takes place within a transaction,
 * this method will not be called until the transaction is
 * committed. However, if the destroy is not taking place in
 * a transaction, the method will be run after the save
 * is complete.
 *
 * class User extends ApplicationModel {
 *   @Decorator.AfterDestroyCommit()
 *   public doSomething() {
 *     ...
 *   }
 * }
 */

export default function AfterDestroyCommit(): any {
  return function (_: any, context: DecoratorContext) {
    context.addInitializer(function (this: Dream) {
      afterDestroyCommitImplementation(this, context.name)
    })
  }
}

export function afterDestroyCommitImplementation<T extends Dream>(target: T, key: string) {
  const dreamClass: typeof Dream = target.constructor as typeof Dream
  if (!dreamClass['globallyInitializingDecorators']) return

  if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
    dreamClass['hooks'] = blankHooksFactory(dreamClass)

  const hookStatement: HookStatement = {
    className: dreamClass.name,
    method: key,
    type: 'afterDestroyCommit',
  }

  dreamClass['addHook']('afterDestroyCommit', hookStatement)
}
