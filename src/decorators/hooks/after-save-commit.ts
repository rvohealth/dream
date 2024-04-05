import Dream from '../../dream'
import { HookStatement, blankHooksFactory, AfterHookOpts } from './shared'

export default function AfterSaveCommit<T extends Dream | null = null>(opts: AfterHookOpts<T> = {}): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
      dreamClass['hooks'] = blankHooksFactory(dreamClass)

    dreamClass['hooks']['afterSaveCommit'].push({
      method: key,
      type: 'afterSaveCommit',
      ifChanged: opts.ifChanged,
    } as HookStatement)
  }
}
