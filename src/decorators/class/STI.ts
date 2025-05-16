import Dream from '../../Dream.js'
import StiChildIncompatibleWithReplicaSafeDecorator from '../../errors/sti/StiChildIncompatibleWithReplicaSafeDecorator.js'
import StiChildIncompatibleWithSoftDeleteDecorator from '../../errors/sti/StiChildIncompatibleWithSoftDeleteDecorator.js'
import { scopeImplementation } from '../static-method/Scope.js'

export const STI_SCOPE_NAME = 'dream:STI'

export default function STI({ value }: { value?: string } = {}): ClassDecorator {
  return function (target: any) {
    const stiChildClass = target as typeof Dream
    const baseClass = findStiBaseClass(stiChildClass)

    if (Object.getOwnPropertyDescriptor(stiChildClass, 'replicaSafe'))
      throw new StiChildIncompatibleWithReplicaSafeDecorator(stiChildClass)

    if (Object.getOwnPropertyDescriptor(stiChildClass, 'softDelete'))
      throw new StiChildIncompatibleWithSoftDeleteDecorator(stiChildClass)

    if (!Object.getOwnPropertyDescriptor(baseClass, 'extendedBy')) baseClass['extendedBy'] = []
    baseClass['extendedBy']!.push(stiChildClass)

    stiChildClass['sti'] = {
      active: true,
      baseClass,
      value: value || stiChildClass.sanitizedName,
    }
    ;(stiChildClass as any)[STI_SCOPE_NAME] = function (query: any) {
      return query.where({ type: stiChildClass['sti'].value })
    }

    scopeImplementation(stiChildClass, STI_SCOPE_NAME, { default: true })
  }
}

function findStiBaseClass(
  originalClass: typeof Dream,
  currentClass: typeof Dream = originalClass,
  previousClass?: typeof Dream
): typeof Dream {
  if (currentClass === Dream) {
    if (previousClass === undefined) throw new Error(`Called \`findStiBaseClass\` on Dream itself`)
    return previousClass
  }

  const parentClass = Object.getPrototypeOf(currentClass)
  if (!parentClass || parentClass === Function.prototype)
    throw new Error(`${originalClass.name} does not extend a Dream class`)

  return findStiBaseClass(originalClass, parentClass, currentClass)
}
