import Dream from '../../Dream.js'
import StiChildCannotDefineNewAssociations from '../../errors/sti/StiChildCannotDefineNewAssociations.js'
import StiChildIncompatibleWithReplicaSafeDecorator from '../../errors/sti/StiChildIncompatibleWithReplicaSafeDecorator.js'
import StiChildIncompatibleWithSoftDeleteDecorator from '../../errors/sti/StiChildIncompatibleWithSoftDeleteDecorator.js'
import { scopeImplementation } from '../static-method/Scope.js'

export const STI_SCOPE_NAME = 'dream:STI'

export default function STI(dreamClass: typeof Dream, { value }: { value?: string } = {}): ClassDecorator {
  return function (target: any) {
    const stiChildClass = target as typeof Dream
    const baseClass = dreamClass['sti'].baseClass || dreamClass

    if (Object.getOwnPropertyDescriptor(stiChildClass, 'associationMetadataByType'))
      throw new StiChildCannotDefineNewAssociations(baseClass, stiChildClass)

    if (Object.getOwnPropertyDescriptor(stiChildClass, 'replicaSafe'))
      throw new StiChildIncompatibleWithReplicaSafeDecorator(stiChildClass)

    if (Object.getOwnPropertyDescriptor(stiChildClass, 'softDelete'))
      throw new StiChildIncompatibleWithSoftDeleteDecorator(stiChildClass)

    if (!Object.getOwnPropertyDescriptor(stiChildClass, 'extendedBy')) stiChildClass['extendedBy'] = []
    if (!Object.getOwnPropertyDescriptor(dreamClass, 'extendedBy')) dreamClass['extendedBy'] = []
    dreamClass['extendedBy']!.push(stiChildClass)

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
