import Dream from '../../Dream.js'

export default class CannotSetEncryptedColumnInQueryUpdate extends Error {
  constructor(
    private dreamClass: typeof Dream,
    private encryptedColumnName: string,
    private encryptedProperty: string
  ) {
    super()
  }

  public override get message() {
    return `
Cannot write a non-null value to an @Encrypted backing column from a query-level update.

Dream class: ${this.dreamClass.sanitizedName}
Encrypted backing column: ${this.encryptedColumnName}
Property to write instead: ${this.encryptedProperty}

\`update(attributes, { skipHooks: true })\` compiles to a single UPDATE statement and
never instantiates a model, so nothing encrypts the value on its way to the column:
"${this.encryptedColumnName}" would be written as plaintext, exactly as passed.

Write through the property instead, so that Dream encrypts the value:

  await ${this.dreamClass.sanitizedName}.where({ ... }).update({ ${this.encryptedProperty}: 'value' })
  await ${this.dreamClass.sanitizedName}.where({ ... }).update({ ${this.encryptedProperty}: 'value' }, { lock: true, skipHooks: true })

Setting "${this.encryptedColumnName}" to null is permitted, and is how this path clears the column.
`
  }
}
