import Dream from '../../Dream.js'
import { AssociationStatement } from '../../types/associations/shared.js'

export default class CannotIgnoreAssociationColumn extends Error {
  constructor(
    private tableName: string,
    private columnName: string,
    private modelClass: typeof Dream,
    private association: AssociationStatement,
    private columnRole: 'foreign key' | 'polymorphic type field'
  ) {
    super()
  }

  public override get message() {
    return `
The models backed by the "${this.tableName}" table declare
"${this.columnName}" in ignoredColumns, but "${this.columnName}" is the
${this.columnRole} of the ${this.association.type} association
"${this.association.as}" on ${this.modelClass.sanitizedName}.

Associations read and write their columns by name, so ignoring
"${this.columnName}" would silently break "${this.association.as}" at
runtime: writes to the column would stop persisting, and association loads
would reference a column missing from the generated schema. Remove the
"${this.association.as}" association from ${this.modelClass.sanitizedName}
(or point it at a different column) before ignoring "${this.columnName}".
`
  }
}
