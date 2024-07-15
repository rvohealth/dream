import Dream from '../dream'
import Scope from './scope'

export const STI_SCOPE_NAME = 'dream:STI'

export default function STI(dreamClass: typeof Dream, { value }: { value?: string } = {}): ClassDecorator {
  return function (target: any) {
    const stiChildClass = target as typeof Dream
    const baseClass = dreamClass['sti'].baseClass || dreamClass

    if (!Object.getOwnPropertyDescriptor(stiChildClass, 'extendedBy')) stiChildClass['extendedBy'] = []
    if (!Object.getOwnPropertyDescriptor(dreamClass, 'extendedBy')) dreamClass['extendedBy'] = []
    dreamClass['extendedBy']!.push(stiChildClass)

    stiChildClass['sti'] = {
      active: true,
      baseClass,
      value: value || stiChildClass.name,
    }
    ;(stiChildClass as any)[STI_SCOPE_NAME] = function (query: any) {
      return query.where({ type: stiChildClass['sti'].value })
    }

    Scope({ default: true })(stiChildClass, STI_SCOPE_NAME)
  }
}
