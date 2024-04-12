import Dream from '../../dream'
import { HookStatement, blankHooksFactory, AfterHookOpts } from './shared'

export default function AfterCreateCommit<T extends Dream | null = null>(opts: AfterHookOpts<T> = {}): any {
  // eslint-disable-next-line
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
