import { HookStatement } from './shared'

export default function AfterDestroy(): any {
  return function (target: any, key: string, _: any) {
    Object.defineProperty(target.constructor.hooks, 'afterDestroy', {
      value: [
        ...(target.constructor.hooks.afterDestroy as HookStatement[]),
        {
          method: key,
        },
      ],
    })
  }
}
