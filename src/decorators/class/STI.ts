import Dream from '../../Dream.js'
import StiChildCannotDefineNewAssociations from '../../errors/sti/StiChildCannotDefineNewAssociations.js'
import StiChildIncompatibleWithReplicaSafeDecorator from '../../errors/sti/StiChildIncompatibleWithReplicaSafeDecorator.js'
import StiChildIncompatibleWithSoftDeleteDecorator from '../../errors/sti/StiChildIncompatibleWithSoftDeleteDecorator.js'
import { AssociationStatement, AssociationStatementsMap } from '../../types/associations/shared.js'
import { scopeImplementation } from '../static-method/Scope.js'

export const STI_SCOPE_NAME = 'dream:STI'

export default function STI(dreamClass: typeof Dream) {
  return function (stiChildClass: typeof Dream): void {
    const baseClass = dreamClass['sti'].baseClass || dreamClass

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
      value: stiChildClass.sanitizedName,
    }
    ;(stiChildClass as any)[STI_SCOPE_NAME] = function (query: any) {
      return query.where({ type: stiChildClass['sti'].value })
    }

    scopeImplementation(stiChildClass, STI_SCOPE_NAME, { default: true })
  }
}

export function validateStiChildAssociations(dreamClasses: (typeof Dream)[]) {
  dreamClasses.forEach(dreamClass => {
    if (!dreamClass?.isDream) return
    if (!dreamClass['sti'].active) return

    const baseClass = dreamClass['sti'].baseClass
    if (!baseClass) return
    if (hasAssociationsUnavailableOnBase(baseClass, dreamClass))
      throw new StiChildCannotDefineNewAssociations(baseClass, dreamClass)
  })
}

function hasAssociationsUnavailableOnBase(baseClass: typeof Dream, stiChildClass: typeof Dream) {
  const baseAssociationKeys = associationKeysByTypeAndName(baseClass['associationMetadataByType'])
  const childAssociationKeys = associationKeysByTypeAndName(stiChildClass['associationMetadataByType'])

  for (const associationKey of childAssociationKeys) {
    if (!baseAssociationKeys.has(associationKey)) return true
  }

  return false
}

function associationKeysByTypeAndName(associationMetadataByType: AssociationStatementsMap) {
  const res = new Set<string>()

  Object.entries(associationMetadataByType).forEach(([associationType, associations]) => {
    associations.forEach((association: AssociationStatement) => {
      res.add(`${associationType}:${association.as}`)
    })
  })

  return res
}
