import Dream from '../../Dream.js'
import { BelongsToStatement, HasManyStatement, HasOneStatement } from '../../package-exports/types.js'

export default function extractAssignableAssociationAttributes(
  association:
    | BelongsToStatement<any, any, any, any>
    | HasManyStatement<any, any, any, any>
    | HasOneStatement<any, any, any, any>,
  dreamInstance: Dream
) {
  const returnObj: Record<string, unknown> = {
    [association.foreignKey()]: association.primaryKeyValue(dreamInstance),
  }

  if (association.polymorphic) {
    returnObj[association.foreignKeyTypeField()] = dreamInstance.referenceTypeString
  }

  return returnObj
}
