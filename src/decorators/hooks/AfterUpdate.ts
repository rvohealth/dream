import Dream from '../../Dream2'
import { AfterHookOpts, HookStatement, blankHooksFactory } from './shared'

export default function AfterUpdate<T extends Dream | null = null>(opts: AfterHookOpts<T> = {}): any {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
      dreamClass['hooks'] = blankHooksFactory(dreamClass)

    const hookStatement: HookStatement = {
      className: dreamClass.name,
      method: key,
      type: 'afterUpdate',
      ifChanged: opts.ifChanged,
    }

    dreamClass['addHook']('afterUpdate', hookStatement)
  }
}
