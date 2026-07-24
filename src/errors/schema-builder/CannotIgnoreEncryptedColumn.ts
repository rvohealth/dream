import Dream from '../../Dream.js'

export default class CannotIgnoreEncryptedColumn extends Error {
  constructor(
    private modelClass: typeof Dream,
    private columnName: string
  ) {
    super()
  }

  public override get message() {
    return `
${this.modelClass.sanitizedName} declares "${this.columnName}" in
ignoredColumns, but "${this.columnName}" is the backing column of an
@Encrypted property on ${this.modelClass.sanitizedName}.

@Encrypted stores its ciphertext in this column, so it can never be
ignored. Remove the @Encrypted declaration (and its property) from
${this.modelClass.sanitizedName} before ignoring "${this.columnName}".
`
  }
}
