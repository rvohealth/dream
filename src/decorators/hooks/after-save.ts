import { blankHooksFactory } from './shared'

export default function AfterSave(): any {
  return function (target: any, key: string, _: any) {
    if (!Object.getOwnPropertyDescriptor(target.constructor, 'hooks'))
      target.constructor.hooks = blankHooksFactory()

    target.constructor.hooks['afterSave'].push({
      method: key,
    })
  }
}
