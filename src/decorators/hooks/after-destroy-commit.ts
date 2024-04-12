import Dream from '../../dream'
import { HookStatement, blankHooksFactory } from './shared'

export default function AfterDestroyCommit(): any {
  // eslint-disable-next-line
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
      dreamClass['hooks'] = blankHooksFactory(dreamClass)

    const hookStatement: HookStatement = {
      className: dreamClass.name,
      method: key,
      type: 'afterDestroyCommit',
    }

    dreamClass['addHook']('afterDestroyCommit', hookStatement)
  }
}
