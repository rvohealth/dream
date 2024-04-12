import Scope from './scope'
import Dream from '../dream'

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
    ;(stiChildClass as any)['applySTIScope'] = function (query: any) {
      // eslint-disable-next-line
      return query.where({ type: stiChildClass['sti'].value })
    }

    // eslint-disable-next-line
    Scope({ default: true })(stiChildClass, 'applySTIScope')
  }
}
