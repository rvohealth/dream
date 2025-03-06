import { HasManyStatement } from '../../decorators/associations/HasMany.js'
import { HasOneStatement } from '../../decorators/associations/HasOne.js'

export default class MissingRequiredAssociationOnClause extends Error {
  constructor(
    private association: HasManyStatement<any, any, any, any> | HasOneStatement<any, any, any, any>,
    private column: string
  ) {
    super()
  }

  public get message() {
    return `
Missing required association on clause:
Association: ${this.association.as}
Missing on clause for column: ${this.column}
`
  }
}
