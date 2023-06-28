import { HasManyStatement } from '../decorators/associations/has-many'
import { HasOneStatement } from '../decorators/associations/has-one'
import Dream from '../dream'

export default class CannotCreateAssociationWithThroughContext extends Error {
  public dreamClass: typeof Dream
  public association: HasManyStatement<any> | HasOneStatement<any>

  constructor({
    dreamClass,
    association,
  }: {
    dreamClass: typeof Dream
    association: HasOneStatement<any> | HasManyStatement<any>
  }) {
    super()
    this.dreamClass = dreamClass
    this.association = association
  }

  public get message() {
    return `
Cannot call 'createAssociation' for through associations, since it is impossible to know the foreign key
you are attempting to use to couple them.
Dream class: ${this.dreamClass.name}
Association: ${this.association.as}
    `
  }
}
