export default class FailedToDecryptColumn extends Error {
  public get message() {
    return `
        Dream failed to decrypt a column value. Usually, this is due to an
        invalid encryption setup within your application. Make sure that the
        encryption algorithm and keys are both present and match.

        // conf/dream.ts
        export default (dream: DreamApplication) => {
          dream.set('encryption', {
            column: {
              current: {
                algorithm: '<YOUR_ALGORITHM>',
                key: process.env.COLUMN_ENCRYPTION_KEY! 
              },
              legacy: {
                algorithm: '<YOUR_LEGACY_ALGORITHM>',
                key: process.env.LEGACY_COLUMN_ENCRYPTION_KEY! 
              },
            }
          })
        }

      A valid encryption key can be generated for your algorithm using:

        Encrypt.generateKey('<YOUR_ALGORITHM>')
    `
  }
}
