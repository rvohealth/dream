import { HookStatement } from './shared'

export default function BeforeSave(): any {
  return function (target: any, key: string, _: any) {
    Object.defineProperty(target.constructor.hooks, 'beforeSave', {
      value: [
        ...(target.constructor.hooks.beforeSave as HookStatement[]),
        {
          method: key,
        },
      ],
    })
  }
}
