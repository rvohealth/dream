import Scope from './scope'
import Dream from '../dream'

export default function STI(dreamClass: typeof Dream, { value }: { value?: string } = {}): ClassDecorator {
  return function (target: any) {
    const stiChildClass = target as typeof Dream
    const baseClass = dreamClass['sti'].baseClass || dreamClass

    if (!Object.getOwnPropertyDescriptor(stiChildClass, 'extendedBy')) stiChildClass['extendedBy'] = []
    if (!Object.getOwnPropertyDescriptor(dreamClass, 'extendedBy')) dreamClass['extendedBy'] = []
    dreamClass['extendedBy']!.push(stiChildClass)

    const stiScopeName = 'dream:STI'

    stiChildClass['sti'] = {
      active: true,
      baseClass,
      value: value || stiChildClass.name,
    }
    ;(stiChildClass as any)[stiScopeName] = function (query: any) {
      return query.where({ type: stiChildClass['sti'].value })
    }

    Scope({ default: true })(stiChildClass, stiScopeName)
  }
}
