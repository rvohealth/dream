import Dream from '../../../Dream.js.js'
import NonBelongsToAssociationProvidedAsSortableDecoratorScope from '../../../errors/NonBelongsToAssociationProvidedAsSortableDecoratorScope.js.js'
import SortableDecoratorRequiresColumnOrBelongsToAssociation from '../../../errors/SortableDecoratorRequiresColumnOrBelongsToAssociation.js.js'
import { BelongsToStatement } from '../../associations/BelongsTo.js.js'
import { HasManyStatement } from '../../associations/HasMany.js.js'
import { HasOneStatement } from '../../associations/HasOne.js.js'

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
