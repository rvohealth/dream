import Dream from '../../dream'
import { HookStatement, blankHooksFactory, BeforeHookOpts } from './shared'

export default function BeforeUpdate<T extends Dream>(opts: BeforeHookOpts<T> = {}): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
      dreamClass['hooks'] = blankHooksFactory(dreamClass)

    dreamClass['hooks']['beforeUpdate'].push({
      method: key,
      type: 'beforeUpdate',
      ifChanging: opts.ifChanging,
    } as HookStatement)
  }
}
