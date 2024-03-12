import { BelongsToStatement } from '../../decorators/associations/belongs-to'
import Dream from '../../dream'

export default class CannotJoinPolymorphicBelongsToError extends Error {
  public dreamClass: typeof Dream
  public association: BelongsToStatement<any, any, any, any>
  public joinsStatements: any

  constructor({
    dreamClass,
    association,
    joinsStatements,
  }: {
    dreamClass: typeof Dream
    association: BelongsToStatement<any, any, any, any>
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
