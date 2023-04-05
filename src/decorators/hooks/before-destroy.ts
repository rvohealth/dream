import { HookStatement } from './shared'

export default function BeforeDestroy(): any {
  return function (target: any, key: string, _: any) {
    Object.defineProperty(target.constructor.hooks, 'beforeDestroy', {
      value: [
        ...(target.constructor.hooks.beforeDestroy as HookStatement[]),
        {
          method: key,
        },
      ],
    })
  }
}
