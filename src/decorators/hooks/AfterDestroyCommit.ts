import Dream from '../../Dream'
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
 *   @AfterDestroyCommit()
 *   public doSomething() {
 *     ...
 *   }
 * }
 */
export default function AfterDestroyCommit(): any {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
      dreamClass['hooks'] = blankHooksFactory(dreamClass)

    const hookStatement: HookStatement = {
      className: dreamClass.name,
      method: key,
      type: 'afterDestroyCommit',
    }

    dreamClass['addHook']('afterDestroyCommit', hookStatement)
  }
}
