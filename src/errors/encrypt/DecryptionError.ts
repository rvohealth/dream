export default class DecryptionError extends Error {
  public override get message() {
    return 'Failed to decrypt: cipher operation, authentication tag, or payload shape was invalid. The ciphertext may have been tampered with, corrupted, or encrypted with a different key.'
  }
}
