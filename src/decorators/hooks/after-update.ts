import { HookStatement } from './shared'

export default function AfterUpdate(): any {
  return function (target: any, key: string, _: any) {
    Object.defineProperty(target.constructor.hooks, 'afterUpdate', {
      value: [
        ...(target.constructor.hooks.afterUpdate as HookStatement[]),
        {
          method: key,
        },
      ],
    })
  }
}
