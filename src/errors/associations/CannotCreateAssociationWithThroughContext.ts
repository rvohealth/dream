import { HasManyStatement } from '../../decorators/field/association/HasMany.js'
import { HasOneStatement } from '../../decorators/field/association/HasOne.js'
import Dream from '../../Dream.js'

export default class CannotCreateAssociationWithThroughContext extends Error {
  public dreamClass: typeof Dream
  public association: HasManyStatement<any, any, any, any> | HasOneStatement<any, any, any, any>

  constructor({
    dreamClass,
    association,
  }: {
    dreamClass: typeof Dream
    association: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>
  }) {
    super()
    this.dreamClass = dreamClass
    this.association = association
  }

  public get message() {
    return `
'createAssociation' is not supported for through associations.
Dream class: ${this.dreamClass.sanitizedName}
Association: ${this.association.as}
    `
  }
}
