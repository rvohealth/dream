import { BelongsToStatement } from '../../decorators/associations/BelongsTo'
import Dream from '../../Dream'

export default class CannotJoinPolymorphicBelongsToError extends Error {
  public dreamClass: typeof Dream
  public association: BelongsToStatement<any, any, any, any>
  public innerJoinStatements: any
  public leftJoinStatements: any

  constructor({
    dreamClass,
    association,
    innerJoinStatements,
    leftJoinStatements,
  }: {
    dreamClass: typeof Dream
    association: BelongsToStatement<any, any, any, any>
    innerJoinStatements: any
    leftJoinStatements: any
  }) {
    super()
    this.dreamClass = dreamClass
    this.association = association
    this.innerJoinStatements = innerJoinStatements
    this.leftJoinStatements = leftJoinStatements
  }

  public get message() {
    return `
Cannot join on a polymorphic BelongsTo
Dream class: ${this.dreamClass.name}
Association: ${this.association.as}
Inner Join statements:
${JSON.stringify(this.innerJoinStatements, null, 2)}
Left Join statements:
${JSON.stringify(this.leftJoinStatements, null, 2)}
    `
  }
}
