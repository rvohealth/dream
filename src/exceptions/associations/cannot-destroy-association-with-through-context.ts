import { HasManyStatement } from '../../decorators/associations/has-many'
import { HasOneStatement } from '../../decorators/associations/has-one'
import Dream from '../../dream'

export default class CannotDestroyAssociationWithThroughContext extends Error {
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
'destroyAssociation' is not supported for through associations.
Dream class: ${this.dreamClass.name}
Association: ${this.association.as}
    `
  }
}
