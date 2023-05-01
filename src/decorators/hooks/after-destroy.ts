import { HookStatement, blankHooksFactory } from './shared'

export default function AfterDestroy(): any {
  return function (target: any, key: string, _: any) {
    if (!Object.getOwnPropertyDescriptor(target.constructor, 'hooks'))
      target.constructor.hooks = blankHooksFactory()

    target.constructor.hooks['afterDestroy'].push({
      method: key,
      type: 'afterDestroy',
    } as HookStatement)
  }
}
