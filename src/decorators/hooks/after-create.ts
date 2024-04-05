import Dream from '../../dream'
import { HookStatement, blankHooksFactory, AfterHookOpts } from './shared'

export default function AfterCreate(opts: AfterHookOpts = {}): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor
    if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
      dreamClass['hooks'] = blankHooksFactory(dreamClass)

    dreamClass['hooks']['afterCreate'].push({
      method: key,
      type: 'afterCreate',
      ifChanged: opts.ifChanged,
    } as HookStatement)
  }
}
