import '../../helpers/polyfills/symbolMetadata.js'

import Dream from '../../Dream.js'
import StiChildCannotDeclareJSONColumnShape from '../../errors/sti/StiChildCannotDeclareJSONColumnShape.js'
import StiChildCannotDeclareSortable from '../../errors/sti/StiChildCannotDeclareSortable.js'
import StiChildCannotDefineNewAssociations from '../../errors/sti/StiChildCannotDefineNewAssociations.js'
import StiChildIncompatibleWithReplicaSafeDecorator from '../../errors/sti/StiChildIncompatibleWithReplicaSafeDecorator.js'
import StiChildIncompatibleWithSoftDeleteDecorator from '../../errors/sti/StiChildIncompatibleWithSoftDeleteDecorator.js'
import { associationDeclarationNamesFromMetadata } from '../field/association/shared.js'
import { JSON_DECLARATION_METADATA_KEY } from '../field/JSON.js'
import { SORTABLE_DECLARATION_METADATA_KEY } from '../field/sortable/Sortable.js'
import { declarationNamesFromMetadata } from '../helpers/declarationMetadata.js'
import { scopeImplementation } from '../static-method/Scope.js'

export const STI_SCOPE_NAME = 'dream:STI'

export default function STI(dreamClass: typeof Dream) {
  return function (stiChildClass: typeof Dream, context?: ClassDecoratorContext): void {
    const baseClass = dreamClass['sti'].baseClass || dreamClass

    if (associationDeclarationNamesFromMetadata(context?.metadata).length)
      throw new StiChildCannotDefineNewAssociations(baseClass, stiChildClass)

    // a json/jsonb column lives on the table the base and every child share,
    // so its one shape is declared on the base
    const jsonDeclarationNames = declarationNamesFromMetadata(
      context?.metadata,
      JSON_DECLARATION_METADATA_KEY
    )
    if (jsonDeclarationNames.length)
      throw new StiChildCannotDeclareJSONColumnShape(baseClass, stiChildClass, jsonDeclarationNames)

    // positions are kept across every row of the table the base and every
    // child share, so a child's Sortable field would number its siblings'
    // rows with its own; per-type lists are the base's `scope: 'type'`
    const sortableDeclarationNames = declarationNamesFromMetadata(
      context?.metadata,
      SORTABLE_DECLARATION_METADATA_KEY
    )
    if (sortableDeclarationNames.length)
      throw new StiChildCannotDeclareSortable(baseClass, stiChildClass, sortableDeclarationNames)

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
