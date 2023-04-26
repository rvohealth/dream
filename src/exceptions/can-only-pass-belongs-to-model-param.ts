import { HasManyStatement } from '../decorators/associations/has-many'
import { HasOneStatement } from '../decorators/associations/has-one'
import Dream from '../dream'

export default class CanOnlyPassBelongsToModelParam extends Error {
  public dreamClass: typeof Dream
  public association: HasManyStatement<any> | HasOneStatement<any>

  constructor(dreamClass: typeof Dream, association: HasManyStatement<any> | HasOneStatement<any>) {
    super()
    this.dreamClass = dreamClass
    this.association = association
  }

  public get message() {
    return `
Can only pass BelongsTo associated models as params
Dream class: ${this.dreamClass.name}
Association: ${this.association.as}
Association type: ${this.association.type}
    `
  }
}
