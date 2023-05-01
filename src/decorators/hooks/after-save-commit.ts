import { HookStatement, blankHooksFactory } from './shared'

export default function AfterSaveCommit(): any {
  return function (target: any, key: string, _: any) {
    if (!Object.getOwnPropertyDescriptor(target.constructor, 'hooks'))
      target.constructor.hooks = blankHooksFactory()

    target.constructor.hooks['afterSaveCommit'].push({
      method: key,
      type: 'afterSaveCommit',
    } as HookStatement)
  }
}
