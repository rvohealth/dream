import dream from '../dream'
import { Tables } from '../db/reflections'
import Scope from './scope'
import Dream from '../dream'

export default function STI({ value, column }: { value?: string; column?: string } = {}): ClassDecorator {
  return function (target: any) {
    const t = target as typeof Dream

    t.sti = {
      active: true,
      column: column || 'type',
      value: value || t.name,
    }
    ;(t as any)['applySTIScope'] = function (query: any) {
      return query.where({ [t.sti.column as string]: t.sti.value })
    }
    Scope({ default: true })(t, 'applySTIScope')
  }
}
