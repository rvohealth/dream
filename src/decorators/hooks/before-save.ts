import Dream from '../../dream'
import { HookStatement, blankHooksFactory, BeforeHookOpts } from './shared'

export default function BeforeSave<T extends Dream | null = null>(opts: BeforeHookOpts<T> = {}): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
      dreamClass['hooks'] = blankHooksFactory(dreamClass)

    const hookStatement: HookStatement = {
      className: dreamClass.name,
      method: key,
      type: 'beforeSave',
      ifChanging: opts.ifChanging,
    }

    dreamClass['addHook']('beforeSave', hookStatement)
  }
}
