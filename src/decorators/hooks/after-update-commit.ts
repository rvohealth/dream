import { HookStatement, blankHooksFactory } from './shared'

export default function AfterUpdateCommit(): any {
  return function (target: any, key: string, _: any) {
    if (!Object.getOwnPropertyDescriptor(target.constructor, 'hooks'))
      target.constructor.hooks = blankHooksFactory()

    target.constructor.hooks['afterUpdateCommit'].push({
      method: key,
      type: 'afterUpdateCommit',
    } as HookStatement)
  }
}
