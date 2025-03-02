import Dream from '../../Dream'
import { DecoratorContext } from '../DecoratorContextType'
import { AfterHookOpts, HookStatement, blankHooksFactory } from './shared'

/**
 * Calls the decorated method whenever a dream has finished
 * being saved. If the save takes place within a transaction,
 * this method will not be called until the transaction is
 * committed. However, if the save is not taking place in
 * a transaction, the method will be run after the save
 * is complete.
 *
 * class User extends ApplicationModel {
 *   @Decorator.AfterSaveCommit()
 *   public doSomething() {
 *     ...
 *   }
 * }
 *
 * @param opts.ifChanged - Optional. A list of columns which should must change in order for this function to be called.
 */

export default function AfterSaveCommit<T extends Dream>(opts: AfterHookOpts<T> = {}): any {
  return function (_: any, context: DecoratorContext) {
    context.addInitializer(function (this: T) {
      afterSaveCommitImplementation(this, context.name, opts)
    })
  }
}

export function afterSaveCommitImplementation<T extends Dream>(
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
    type: 'afterSaveCommit',
    ifChanged: opts.ifChanged,
  }

  dreamClass['addHook']('afterSaveCommit', hookStatement)
}
