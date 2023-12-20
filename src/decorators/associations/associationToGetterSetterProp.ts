import { HasManyStatement } from './has-many'
import { HasOneStatement } from './has-one'
import { BelongsToStatement } from './belongs-to'
import { PartialAssociationStatement } from './shared'

export default function associationToGetterSetterProp(
  association:
    | BelongsToStatement<any, any, any>
    | HasManyStatement<any, any, any>
    | HasOneStatement<any, any, any>
    | PartialAssociationStatement
) {
  return `__${association.as}__`
}
