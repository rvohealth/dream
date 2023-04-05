import { HookStatement } from './shared'

export default function BeforeCreate(): any {
  return function (target: any, key: string, _: any) {
    Object.defineProperty(target.constructor.hooks, 'beforeCreate', {
      value: [
        ...(target.constructor.hooks.beforeCreate as HookStatement[]),
        {
          method: key,
        },
      ],
    })
  }
}
