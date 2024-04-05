import Dream from '../../dream'
import { HookStatement, blankHooksFactory, BeforeBeforeHookOpts } from './shared'

export default function BeforeCreate(opts: BeforeBeforeHookOpts = {}): any {
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
