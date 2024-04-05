import Dream from '../../dream'
import { HookStatement, blankHooksFactory, BeforeBeforeHookOpts } from './shared'

export default function BeforeSave(opts: BeforeBeforeHookOpts = {}): any {
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
