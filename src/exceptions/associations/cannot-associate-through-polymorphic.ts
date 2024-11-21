import { HasManyStatement } from '../../decorators/associations/HasMany'
import { HasOneStatement } from '../../decorators/associations/HasOne'
import Dream from '../../Dream'

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
Dream class: ${this.dreamClass.name}
Association: ${this.association.as}
    `
  }
}
