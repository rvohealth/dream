import Dream from '../Dream.js.js'

export default class DoNotSetEncryptedFieldsDirectly extends Error {
  constructor(
    private dreamClass: typeof Dream,
    private encryptedColumnName: string,
    private encryptedProperty: string
  ) {
    super()
  }

  public get message() {
    return `
Do not set @Encrypted columns directly. Instead, set their accessors, so that
those fields can be encrypted by Dream internally.

Dream class: ${this.dreamClass.sanitizedName}
Problematic setter: ${this.encryptedColumnName}
Setter to be used instead: ${this.encryptedProperty}`
  }
}
