import { HookStatement } from './shared'

export default function BeforeUpdate(): any {
  return function (target: any, key: string, _: any) {
    Object.defineProperty(target.constructor.hooks, 'beforeUpdate', {
      value: [
        ...(target.constructor.hooks.beforeUpdate as HookStatement[]),
        {
          method: key,
        },
      ],
    })
  }
}
