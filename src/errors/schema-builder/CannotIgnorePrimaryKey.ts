import Dream from '../../Dream.js'

export default class CannotIgnorePrimaryKey extends Error {
  constructor(private modelClass: typeof Dream) {
    super()
  }

  public override get message() {
    return `
${this.modelClass.sanitizedName} declares its primary key ("${this.modelClass.primaryKey}")
in ignoredColumns.

The primary key is required to identify rows for hydration, updates, and
associations, so it can never be ignored. Remove
"${this.modelClass.primaryKey}" from the ignoredColumns getter on
${this.modelClass.sanitizedName}.
`
  }
}
