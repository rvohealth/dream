import Dream from '../../Dream.js'
import { BelongsToStatement } from '../../types/associations/belongsTo.js'
import { HasManyStatement } from '../../types/associations/hasMany.js'
import { HasOneStatement } from '../../types/associations/hasOne.js'

export default class CannotAssociateThroughMultiplePolymorphics extends Error {
  public dreamClass: typeof Dream
  public association:
    | HasManyStatement<any, any, any, any>
    | HasOneStatement<any, any, any, any>
    | BelongsToStatement<any, any, any, any>
  public innerJoinStatements: any
  public leftJoinStatements: any

  constructor({
    dreamClass,
    association,
    innerJoinStatements,
    leftJoinStatements,
  }: {
    dreamClass: typeof Dream
    association:
      | HasManyStatement<any, any, any, any>
      | HasOneStatement<any, any, any, any>
      | BelongsToStatement<any, any, any, any>
    innerJoinStatements: any
    leftJoinStatements: any
  }) {
    super()
    this.dreamClass = dreamClass
    this.association = association
    this.innerJoinStatements = innerJoinStatements
    this.leftJoinStatements = leftJoinStatements
  }

  public override get message() {
    return `
Cannot associate through multiple polymorphic associations if one of them is a BelongsTo:
Dream class: ${this.dreamClass.sanitizedName}
Association: ${this.association.as}
Inner Join statements:
${JSON.stringify(this.innerJoinStatements, null, 2)}
Left Join statements:
${JSON.stringify(this.leftJoinStatements, null, 2)}
    `
  }
}
