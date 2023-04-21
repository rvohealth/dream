import { BelongsToStatement } from '../decorators/associations/belongs-to'
import { DreamModel } from '../dream'

export default class CannotJoinPolymorphicBelongsToError extends Error {
  public dreamClass: DreamModel<any, any>
  public association: BelongsToStatement<any>
  public joinsStatements: any

  constructor({
    dreamClass,
    association,
    joinsStatements,
  }: {
    dreamClass: DreamModel<any, any>
    association: BelongsToStatement<any>
    joinsStatements: any
  }) {
    super()
    this.dreamClass = dreamClass
    this.association = association
    this.joinsStatements = joinsStatements
  }

  public get message() {
    return `
Cannot join on a polymorphic BelongsTo
Dream class: ${this.dreamClass.name}
Association: ${this.association.as}
Joins statements:
${JSON.stringify(this.joinsStatements, null, 2)}
    `
  }
}
