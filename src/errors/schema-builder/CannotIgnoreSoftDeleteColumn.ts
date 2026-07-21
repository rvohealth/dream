import Dream from '../../Dream.js'

export default class CannotIgnoreSoftDeleteColumn extends Error {
  constructor(
    private modelClass: typeof Dream,
    private columnName: string
  ) {
    super()
  }

  public override get message() {
    return `
${this.modelClass.sanitizedName} declares "${this.columnName}" in
ignoredColumns, but ${this.modelClass.sanitizedName} is a SoftDelete model
and "${this.columnName}" is its deletedAtField.

SoftDelete writes this column on destroy and filters on it in its default
scope, so it can never be ignored. Remove the @SoftDelete decorator from
${this.modelClass.sanitizedName} (or point deletedAtField at a different
column) before ignoring "${this.columnName}".
`
  }
}
