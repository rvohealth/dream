import Dream from '../../dream'
import { HookStatement, blankHooksFactory, BeforeHookOpts } from './shared'

export default function BeforeUpdate<T extends Dream>(opts: BeforeHookOpts<T> = {}): any {
  // eslint-disable-next-line
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
      dreamClass['hooks'] = blankHooksFactory(dreamClass)

    const hookStatement: HookStatement = {
      className: dreamClass.name,
      method: key,
      type: 'beforeUpdate',
      ifChanging: opts.ifChanging,
    }

    dreamClass['addHook']('beforeUpdate', hookStatement)
  }
}
