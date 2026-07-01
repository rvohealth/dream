import Encrypt, { EncryptAlgorithm } from '../../encrypt/index.js'

export default class DreamAppInitInvalidEncryptionKey extends Error {
  constructor(
    private encryptionIdentifier: 'columns',
    private keyType: 'current' | 'legacy',
    private algorithm: EncryptAlgorithm
  ) {
    super()
  }

  public override get message() {
    return `
Your ${this.keyType} key value for ${this.encryptionIdentifier} encryption is invalid.
Try setting it to something valid, like:
  ${Encrypt.generateKey(this.algorithm)}

This was done by calling:
  Encrypt.generateKey('${this.algorithm}')

A new key can also be generated from the CLI:
  % pnpm psy g:encryption-key
  OR
  % pnpm psy g:encryption-key --algorithm=aes-256-gcm
`
  }
}
