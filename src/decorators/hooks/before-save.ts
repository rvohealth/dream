import Dream from '../../dream'
import { HookStatement, blankHooksFactory, BeforeHookOpts } from './shared'

export default function BeforeSave<T extends Dream | null = null>(opts: BeforeHookOpts<T> = {}): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
      dreamClass['hooks'] = blankHooksFactory(dreamClass)

    dreamClass['addHook']('beforeSave', {
      method: key,
      type: 'beforeSave',
      ifChanging: opts.ifChanging,
    } as HookStatement)
  }
}
