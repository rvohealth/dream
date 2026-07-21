import Dream from '../../Dream.js'
import camelize from '../../helpers/camelize.js'

export default class IgnoredColumnMustBeCamelCase extends Error {
  constructor(
    private modelClass: typeof Dream,
    private columnName: string
  ) {
    super()
  }

  public override get message() {
    return `
${this.modelClass.sanitizedName} declares "${this.columnName}" in
ignoredColumns, but ignored columns must be declared in camelCase.

Dream camelizes database column names when generating types, so a
declaration that is not camelCase can never match a generated column and
would be silently inert. Declare "${camelize(this.columnName)}" in the
ignoredColumns getter on ${this.modelClass.sanitizedName} instead.
`
  }
}
