import { HasManyStatement } from '../../decorators/associations/has-many'
import { HasOneStatement } from '../../decorators/associations/has-one'
import Dream from '../../dream'

export default class CannotAssociateThroughPolymorphic extends Error {
  public dreamClass: typeof Dream
  public association: HasManyStatement<any, any, any> | HasOneStatement<any, any, any>

  constructor({
    dreamClass,
    association,
  }: {
    dreamClass: typeof Dream
    association: HasOneStatement<any, any, any> | HasManyStatement<any, any, any>
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
