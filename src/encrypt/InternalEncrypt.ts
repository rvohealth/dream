import DreamApp from '../dream-app/index.js'
import DecryptionError from '../errors/encrypt/DecryptionError.js'
import DecryptionParseError from '../errors/encrypt/DecryptionParseError.js'
import DecryptionRotationError from '../errors/encrypt/DecryptionRotationError.js'
import MissingColumnEncryptionOpts from '../errors/encrypt/MissingColumnEncryptionOpts.js'
import Encrypt, { DecryptCallbacks, DecryptOptions, EncryptOptions } from './index.js'

export default class InternalEncrypt {
  public static encryptColumn(data: any) {
    const dreamApp = DreamApp.getOrFail()
    const encryptOpts = dreamApp.encryption?.columns
    if (!encryptOpts) throw new MissingColumnEncryptionOpts()

    if (data === null || data === undefined) return null

    return this.doEncryption(data, encryptOpts.current)
  }

  /**
   * Returns `existingCiphertext` when the current column key opens it to a
   * value whose JSON serialization equals `data`'s, the plaintext
   * `encryptColumn(data)` would encrypt, and otherwise `encryptColumn(data)`.
   * A value only the legacy key opens, ciphertext no key opens, and a
   * missing `existingCiphertext` all get fresh ciphertext. It never calls
   * `onLegacyKeyUsed`.
   */
  public static reuseOrEncryptColumn(data: any, existingCiphertext: unknown) {
    if (data === null || data === undefined || typeof existingCiphertext !== 'string')
      return this.encryptColumn(data)

    const dreamApp = DreamApp.getOrFail()
    const encryptOpts = dreamApp.encryption?.columns
    if (!encryptOpts) throw new MissingColumnEncryptionOpts()

    let existingPlaintext: unknown
    try {
      existingPlaintext = Encrypt.decrypt(existingCiphertext, encryptOpts.current)
    } catch (err) {
      if (err instanceof DecryptionError || err instanceof DecryptionParseError)
        return this.encryptColumn(data)
      throw err
    }

    return JSON.stringify(existingPlaintext) === JSON.stringify(data)
      ? existingCiphertext
      : this.encryptColumn(data)
  }

  /**
   * Decrypts `data` with the column keys, current then legacy.
   * `onLegacyKeyUsed` is passed to `Encrypt.decrypt`, so it is called only
   * when the legacy key opened the value.
   */
  public static decryptColumn(data: any, callbacks: DecryptCallbacks = {}) {
    const dreamApp = DreamApp.getOrFail()
    const encryptOpts = dreamApp.encryption?.columns
    if (!encryptOpts) throw new MissingColumnEncryptionOpts()

    if (data === null || data === undefined) return null

    return this.doDecryption(data, encryptOpts.current, encryptOpts.legacy, callbacks)
  }

  /**
   * Encrypts `data`, a column's ciphertext, again with the current column key
   * (see `Encrypt.reencrypt`), opening it with the current key or, failing
   * that, the legacy one. It does not call `onLegacyKeyUsed`.
   */
  public static reencryptColumn(data: any) {
    const dreamApp = DreamApp.getOrFail()
    const encryptOpts = dreamApp.encryption?.columns
    if (!encryptOpts) throw new MissingColumnEncryptionOpts()

    if (data === null || data === undefined) return null

    return Encrypt.reencrypt(data, encryptOpts.current, encryptOpts.legacy)
  }

  /**
   * Whether `data` is ciphertext that the column keys (current, then legacy)
   * open to a value `decryptColumn` returns. A missing column encryption
   * config or key still throws, since that is a configuration error rather
   * than a property of `data`.
   */
  public static isDecryptableColumnCiphertext(data: string): boolean {
    const dreamApp = DreamApp.getOrFail()
    const encryptOpts = dreamApp.encryption?.columns
    if (!encryptOpts) throw new MissingColumnEncryptionOpts()

    try {
      this.doDecryption(data, encryptOpts.current, encryptOpts.legacy)
      return true
    } catch (err) {
      if (
        err instanceof DecryptionError ||
        err instanceof DecryptionParseError ||
        err instanceof DecryptionRotationError
      )
        return false
      throw err
    }
  }

  private static doEncryption(data: any, encryptionOpts: EncryptOptions) {
    return Encrypt.encrypt(data, encryptionOpts)
  }

  private static doDecryption(
    data: any,
    encryptionOpts: DecryptOptions,
    legacyEncryptionOpts?: DecryptOptions,
    callbacks: DecryptCallbacks = {}
  ) {
    return Encrypt.decrypt(data, encryptionOpts, legacyEncryptionOpts, callbacks)
  }
}
