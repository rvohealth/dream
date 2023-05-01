import { HookStatement, blankHooksFactory } from './shared'

export default function BeforeDestroy(): any {
  return function (target: any, key: string, _: any) {
    if (!Object.getOwnPropertyDescriptor(target.constructor, 'hooks'))
      target.constructor.hooks = blankHooksFactory()

    target.constructor.hooks['beforeDestroy'].push({
      method: key,
      type: 'beforeDestroy',
    } as HookStatement)
  }
}
