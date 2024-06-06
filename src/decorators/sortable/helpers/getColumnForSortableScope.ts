import Dream from '../../../dream'
import NonBelongsToAssociationProvidedAsSortableDecoratorScope from '../../../exceptions/non-belongs-to-association-provided-as-sortable-decorator-scope'
import SortableDecoratorRequiresColumnOrBelongsToAssociation from '../../../exceptions/sortable-decorator-requires-column-or-belongs-to-association'
import { BelongsToStatement } from '../../associations/belongs-to'
import { HasManyStatement } from '../../associations/has-many'
import { HasOneStatement } from '../../associations/has-one'

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
