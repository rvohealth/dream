import { HookStatement, blankHooksFactory } from './shared'

export default function BeforeSave(): any {
  return function (target: any, key: string, _: any) {
    if (!Object.getOwnPropertyDescriptor(target.constructor, 'hooks'))
      target.constructor.hooks = blankHooksFactory()

    target.constructor.hooks['beforeSave'].push({
      method: key,
      type: 'beforeSave',
    } as HookStatement)
  }
}
