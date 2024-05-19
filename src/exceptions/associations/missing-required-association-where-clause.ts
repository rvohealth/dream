import { HasManyStatement } from '../../decorators/associations/has-many'
import { HasOneStatement } from '../../decorators/associations/has-one'

export default class MissingRequiredAssociationWhereClause extends Error {
  constructor(
    private association: HasManyStatement<any, any, any, any> | HasOneStatement<any, any, any, any>,
    private column: string
  ) {
    super()
  }

  public get message() {
    return `
Missing required association where clause:
Association: ${this.association.as}
Missing where clause for column: ${this.column}
`
  }
}
