import { HookStatement, blankHooksFactory } from './shared'

export default function AfterCreateCommit(): any {
  return function (target: any, key: string, _: any) {
    if (!Object.getOwnPropertyDescriptor(target.constructor, 'hooks'))
      target.constructor.hooks = blankHooksFactory()

    target.constructor.hooks['afterCreateCommit'].push({
      method: key,
      type: 'afterCreateCommit',
    } as HookStatement)
  }
}
