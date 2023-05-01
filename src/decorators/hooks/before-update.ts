import { HookStatement, blankHooksFactory } from './shared'

export default function BeforeUpdate(): any {
  return function (target: any, key: string, _: any) {
    if (!Object.getOwnPropertyDescriptor(target.constructor, 'hooks'))
      target.constructor.hooks = blankHooksFactory()

    target.constructor.hooks['beforeUpdate'].push({
      method: key,
      type: 'beforeUpdate',
    } as HookStatement)
  }
}
