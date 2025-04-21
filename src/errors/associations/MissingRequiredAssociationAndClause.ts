import { HasManyStatement } from '../../types/associations/hasMany.js'
import { HasOneStatement } from '../../types/associations/hasOne.js'

export default class MissingRequiredAssociationAndClause extends Error {
  constructor(
    private association: HasManyStatement<any, any, any, any> | HasOneStatement<any, any, any, any>,
    private column: string | undefined
  ) {
    super()
  }

  public override get message() {
    return `
Missing required association and-clause:
Association: ${this.association.as}
Missing and-clause for column: ${this.column}
`
  }
}
