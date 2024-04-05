import Dream from '../../dream'
import { HookStatement, blankHooksFactory, AfterHookOpts } from './shared'

export default function AfterUpdateCommit(opts: AfterHookOpts = {}): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
      dreamClass['hooks'] = blankHooksFactory(dreamClass)

    dreamClass['addHook']('afterUpdateCommit', {
      method: key,
      type: 'afterUpdateCommit',
      ifChanged: opts.ifChanged,
    } as HookStatement)
  }
}
