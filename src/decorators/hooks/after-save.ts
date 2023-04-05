import { HookStatement } from './shared'

export default function AfterSave(): any {
  return function (target: any, key: string, _: any) {
    Object.defineProperty(target.constructor.hooks, 'afterSave', {
      value: [
        ...(target.constructor.hooks.afterSave as HookStatement[]),
        {
          method: key,
        },
      ],
    })
  }
}
