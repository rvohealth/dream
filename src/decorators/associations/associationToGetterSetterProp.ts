import { BelongsToStatement } from './BelongsTo'
import { HasManyStatement } from './HasMany'
import { HasOneStatement } from './HasOne'
import { PartialAssociationStatement } from './shared'

export default function associationToGetterSetterProp(
  association:
    | BelongsToStatement<any, any, any, any>
    | HasManyStatement<any, any, any, any>
    | HasOneStatement<any, any, any, any>
    | PartialAssociationStatement
) {
  return `__${association.as}__`
}
