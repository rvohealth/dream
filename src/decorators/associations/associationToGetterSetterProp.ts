import { BelongsToStatement } from './BelongsTo.js'
import { HasManyStatement } from './HasMany.js'
import { HasOneStatement } from './HasOne.js'
import { PartialAssociationStatement } from './shared.js'

export default function associationToGetterSetterProp(
  association:
    | BelongsToStatement<any, any, any, any>
    | HasManyStatement<any, any, any, any>
    | HasOneStatement<any, any, any, any>
    | PartialAssociationStatement
) {
  return `__${association.as}__`
}
