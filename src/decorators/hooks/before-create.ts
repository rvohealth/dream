import Dream from '../../dream'
import { HookStatement, blankHooksFactory, BeforeHookOpts } from './shared'

export default function BeforeCreate(opts: BeforeHookOpts = {}): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
      dreamClass['hooks'] = blankHooksFactory(dreamClass)

    dreamClass['hooks']['beforeCreate'].push({
      method: key,
      type: 'beforeCreate',
      ifChanging: opts.ifChanging,
    } as HookStatement)
  }
}
