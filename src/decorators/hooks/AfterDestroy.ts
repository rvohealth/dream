import Dream from '../../Dream'
import { HookStatement, blankHooksFactory } from './shared'

export default function AfterDestroy(): any {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
      dreamClass['hooks'] = blankHooksFactory(dreamClass)

    const hookStatement: HookStatement = {
      className: dreamClass.name,
      method: key,
      type: 'afterDestroy',
    }

    dreamClass['addHook']('afterDestroy', hookStatement)
  }
}
