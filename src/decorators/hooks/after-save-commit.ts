import Dream from '../../dream'
import { HookStatement, blankHooksFactory } from './shared'

export default function AfterSaveCommit(): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
      dreamClass.hooks = blankHooksFactory(dreamClass)

    dreamClass.hooks['afterSaveCommit'].push({
      method: key,
      type: 'afterSaveCommit',
    } as HookStatement)
  }
}
