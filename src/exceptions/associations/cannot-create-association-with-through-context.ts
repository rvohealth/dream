import { HasManyStatement } from '../../decorators/associations/HasMany'
import { HasOneStatement } from '../../decorators/associations/HasOne'
import Dream from '../../Dream2'

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
Dream class: ${this.dreamClass.name}
Association: ${this.association.as}
    `
  }
}
