import Dream from '../../dream'
import { HookStatement, blankHooksFactory } from './shared'

export default function BeforeUpdate(): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
      dreamClass['hooks'] = blankHooksFactory(dreamClass)

    dreamClass['hooks']['beforeUpdate'].push({
      method: key,
      type: 'beforeUpdate',
    } as HookStatement)
  }
}
