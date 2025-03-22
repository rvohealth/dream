import { BelongsToStatement } from '../../../types/associations/belongsTo.js'
import { HasManyStatement } from '../../../types/associations/hasMany.js'
import { HasOneStatement } from '../../../types/associations/hasOne.js'
import { PartialAssociationStatement } from '../../../types/associations/shared.js'

export default function associationToGetterSetterProp(
  association:
    | BelongsToStatement<any, any, any, any>
    | HasManyStatement<any, any, any, any>
    | HasOneStatement<any, any, any, any>
    | PartialAssociationStatement
) {
  return `__${association.as}__`
}
