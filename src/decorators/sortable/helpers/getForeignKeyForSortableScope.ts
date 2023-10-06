import Dream from '../../../dream'
import NonBelongsToScopeProvidedToSortableDecorator from '../../../exceptions/non-belongs-to-scope-provided-to-sortable-decorator'
import NonExistentScopeProvidedToSortableDecorator from '../../../exceptions/non-existent-scope-provided-to-sortable-decorator'
import { BelongsToStatement } from '../../associations/belongs-to'
import { HasManyStatement } from '../../associations/has-many'
import { HasOneStatement } from '../../associations/has-one'
import scopeArray from './scopeArray'

export default function getForeignKeyForSortableScope(dream: Dream, scope?: string) {
  if (!scope) return null

  const associationMetadata = (dream.associationMap() as any)[scope] as
    | BelongsToStatement<any, any, string>
    | HasManyStatement<any, any, string>
    | HasOneStatement<any, any, string>

  if (!associationMetadata)
    throw new NonExistentScopeProvidedToSortableDecorator(scope, dream.constructor as typeof Dream)

  if (associationMetadata.type !== 'BelongsTo')
    throw new NonBelongsToScopeProvidedToSortableDecorator(scope, dream.constructor as typeof Dream)

  return associationMetadata.foreignKey() as any
}
