import { BelongsToStatement } from './BelongsTo.js.js'
import { HasManyStatement } from './HasMany.js.js'
import { HasOneStatement } from './HasOne.js.js'
import { PartialAssociationStatement } from './shared.js.js'

export default function associationToGetterSetterProp(
  association:
    | BelongsToStatement<any, any, any, any>
    | HasManyStatement<any, any, any, any>
    | HasOneStatement<any, any, any, any>
    | PartialAssociationStatement
) {
  return `__${association.as}__`
}
