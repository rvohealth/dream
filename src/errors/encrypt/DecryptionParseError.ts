export default class DecryptionParseError extends Error {
  public override get message() {
    return 'Decryption succeeded but the plaintext was not valid JSON. This indicates an encrypted-format mismatch (e.g. a non-JSON value was passed into Encrypt.encrypt), not tampering.'
  }
}
