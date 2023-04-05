import { HookStatement } from './shared'

export default function AfterCreate(): any {
  return function (target: any, key: string, _: any) {
    Object.defineProperty(target.constructor.hooks, 'afterCreate', {
      value: [
        ...(target.constructor.hooks.afterCreate as HookStatement[]),
        {
          method: key,
        },
      ],
    })
  }
}
