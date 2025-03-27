export default class MissingColumnEncryptionOpts extends Error {
  public override get message() {
    return `
      In order to use the Encrypt library to encrypt columns,
      encryption keys must be provided to dream:

        // conf/dream.ts
        export default (dream: DreamApplication) => {
          dream.set('encryption', {
            column: {
              current: {
                algorithm: 'aes-256-gcm',
                key: Env.string('COLUMN_ENCRYPTION_KEY') 
              },
            }
          })
        }

      A valid encryption key can be generated using:

        Encrypt.generateKey()
    `
  }
}
