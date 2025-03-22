import { HasManyStatement } from '../../types/associations/hasMany.js'
import { HasOneStatement } from '../../types/associations/hasOne.js'

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
