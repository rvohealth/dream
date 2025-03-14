import { HasManyStatement } from '../../decorators/associations/HasMany.js'
import { HasOneStatement } from '../../decorators/associations/HasOne.js'
import Dream from '../../Dream.js'

export default class CannotAssociateThroughPolymorphic extends Error {
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
Cannot join through a polymorphic association
Dream class: ${this.dreamClass.sanitizedName}
Association: ${this.association.as}
    `
  }
}
