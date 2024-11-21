import Dream from '../../Dream'
import { AfterHookOpts, HookStatement, blankHooksFactory } from './shared'

/**
 * Calls the decorated method whenever a dream has finished
 * being created. If the save takes place within a transaction,
 * this method will not be called until the transaction is
 * committed. However, if the save is not taking place in
 * a transaction, the method will be run after the save
 * is complete.
 *
 * class User extends ApplicationModel {
 *   @AfterCreateCommit()
 *   public doSomething() {
 *     ...
 *   }
 * }
 *
 * @param opts.ifChanged - Optional. A list of columns which should must change in order for this function to be called.
 */
export default function AfterCreateCommit<T extends Dream | null = null>(opts: AfterHookOpts<T> = {}): any {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
      dreamClass['hooks'] = blankHooksFactory(dreamClass)

    const hookStatement: HookStatement = {
      className: dreamClass.name,
      method: key,
      type: 'afterCreateCommit',
      ifChanged: opts.ifChanged,
    }

    dreamClass['addHook']('afterCreateCommit', hookStatement)
  }
}
