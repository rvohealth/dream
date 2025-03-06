import { HasManyStatement } from '../../decorators/associations/HasMany.js'
import { HasOneStatement } from '../../decorators/associations/HasOne.js'
import Dream from '../../Dream.js'

export default class CanOnlyPassBelongsToModelParam extends Error {
  public dreamClass: typeof Dream
  public association: HasManyStatement<any, any, any, any> | HasOneStatement<any, any, any, any>

  constructor(
    dreamClass: typeof Dream,
    association: HasManyStatement<any, any, any, any> | HasOneStatement<any, any, any, any>
  ) {
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
