import Dream from '../Dream.js'

export default class DoNotSetEncryptedFieldsDirectly extends Error {
  constructor(
    private dreamClass: typeof Dream,
    private encryptedColumnName: string,
    private encryptedProperty: string
  ) {
    super()
  }

  public override get message() {
    return `
Do not set @Encrypted columns directly. Instead, set their accessors, so that
those fields can be encrypted by Dream internally.

Writes that bypass setters, such as setAttribute, setAttributes and
updateAttributes, accept a value for an @Encrypted column only when it is
ciphertext that decrypts with this app's encryption keys, or null.

Dream class: ${this.dreamClass.sanitizedName}
Problematic setter: ${this.encryptedColumnName}
Setter to be used instead: ${this.encryptedProperty}`
  }
}
