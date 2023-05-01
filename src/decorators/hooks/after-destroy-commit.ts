import { HookStatement, blankHooksFactory } from './shared'

export default function AfterDestroyCommit(): any {
  return function (target: any, key: string, _: any) {
    if (!Object.getOwnPropertyDescriptor(target.constructor, 'hooks'))
      target.constructor.hooks = blankHooksFactory()

    target.constructor.hooks['afterDestroyCommit'].push({
      method: key,
      type: 'afterDestroyCommit',
    } as HookStatement)
  }
}
