import Dream from '../../../../Dream.js'
import NonBelongsToAssociationProvidedAsSortableDecoratorScope from '../../../../errors/NonBelongsToAssociationProvidedAsSortableDecoratorScope.js'
import SortableDecoratorRequiresColumnOrBelongsToAssociation from '../../../../errors/SortableDecoratorRequiresColumnOrBelongsToAssociation.js'
import { BelongsToStatement } from '../../association/BelongsTo.js'
import { HasManyStatement } from '../../association/HasMany.js'
import { HasOneStatement } from '../../association/HasOne.js'

export default function getColumnForSortableScope(dream: Dream, scope?: string) {
  if (!scope) return null

  const dreamClass = dream.constructor as typeof Dream

  if (dreamClass.columns().has(scope)) return scope

  const associationMetadata = (dream['associationMetadataMap']() as any)[scope] as
    | BelongsToStatement<any, any, any, string>
    | HasManyStatement<any, any, any, string>
    | HasOneStatement<any, any, any, string>

  if (!associationMetadata) throw new SortableDecoratorRequiresColumnOrBelongsToAssociation(scope, dreamClass)

  if (associationMetadata.type !== 'BelongsTo')
    throw new NonBelongsToAssociationProvidedAsSortableDecoratorScope(scope, dreamClass)

  return associationMetadata.foreignKey() as any
}
