import Scope from './scope'
import Dream from '../dream'

export default function STI(dreamClass: typeof Dream, { value }: { value?: string } = {}): ClassDecorator {
  return function (target: any) {
    const t = target as typeof Dream

    if (!Object.getOwnPropertyDescriptor(t, 'extendedBy')) t.extendedBy = []
    if (!Object.getOwnPropertyDescriptor(dreamClass, 'extendedBy')) dreamClass.extendedBy = []
    dreamClass.extendedBy!.push(t)

    t.sti = {
      active: true,
      value: value || t.name,
    }
    ;(t as any)['applySTIScope'] = function (query: any) {
      return query.where({ type: t.sti.value })
    }
    Scope({ default: true })(t, 'applySTIScope')
  }
}
