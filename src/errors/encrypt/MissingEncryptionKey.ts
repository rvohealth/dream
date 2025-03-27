export default class MissingEncryptionKey extends Error {
  public override get message() {
    return `
      In order to use the Encrypt library, encryption key and algorithm must be provided:

        Encrypt.encrypt(data, { algorithm: '<YOUR_ALGORITHM>', key: '<YOUR_ENCRYPTION_KEY>' })
    `
  }
}
