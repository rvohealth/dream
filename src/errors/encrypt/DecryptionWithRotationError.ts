import DecryptionError from './DecryptionError.js'

export default class DecryptionWithRotationError extends Error {
  public readonly currentKeyError: DecryptionError
  public readonly legacyKeyError: DecryptionError

  constructor(currentKeyError: DecryptionError, legacyKeyError: DecryptionError) {
    super(undefined, { cause: { current: currentKeyError, legacy: legacyKeyError } })
    this.currentKeyError = currentKeyError
    this.legacyKeyError = legacyKeyError
  }

  public override get message() {
    return 'Failed to decrypt with both the current and legacy keys. The ciphertext may have been tampered with, corrupted, or encrypted with a key that is no longer in rotation.'
  }
}
