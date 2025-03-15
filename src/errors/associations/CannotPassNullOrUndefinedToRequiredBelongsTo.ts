import { BelongsToStatement } from '../../decorators/associations/BelongsTo.js'
import Dream from '../../Dream.js'

export default class CannotPassNullOrUndefinedToRequiredBelongsTo extends Error {
  public dreamClass: typeof Dream
  public association: BelongsToStatement<any, any, any, any>

  constructor(dreamClass: typeof Dream, association: BelongsToStatement<any, any, any, any>) {
    super()
    this.dreamClass = dreamClass
    this.association = association
  }

  public get message() {
    return `
Cannot pass null or undefined as a value to a required association.
Dream class: ${this.dreamClass.sanitizedName}
Association: ${this.association.as}
    `
  }
}
