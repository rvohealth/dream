import dream from '../dream'
import { Tables } from '../db/reflections'
import Scope from './scope'

export default function STI({ value, column }: { value?: string; column?: string } = {}): ClassDecorator {
  return function (target: any) {
    const t = target as ReturnType<typeof dream<any, any>>

    Object.defineProperty(t, 'sti', {
      value: {
        value: value || t.name,
        column: column || 'type',
      },
    })

    Object.defineProperty(t, 'applySTIScope', {
      value: (query: any) => {
        return query.where({ [t.sti.column as string]: t.sti.value })
      },
    })
    Scope({ default: true })(t, 'applySTIScope')
  }
}
