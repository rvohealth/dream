import DreamApp from '../dream-app/index.js'
import DecryptionError from '../errors/encrypt/DecryptionError.js'
import DecryptionParseError from '../errors/encrypt/DecryptionParseError.js'
import DecryptionRotationError from '../errors/encrypt/DecryptionRotationError.js'
import MissingColumnEncryptionOpts from '../errors/encrypt/MissingColumnEncryptionOpts.js'
import Encrypt, { DecryptOptions, EncryptOptions } from './index.js'

export default class InternalEncrypt {
  public static encryptColumn(data: any) {
    const dreamApp = DreamApp.getOrFail()
    const encryptOpts = dreamApp.encryption?.columns
    if (!encryptOpts) throw new MissingColumnEncryptionOpts()

    if (data === null || data === undefined) return null

    return this.doEncryption(data, encryptOpts.current)
  }

  public static decryptColumn(data: any) {
    const dreamApp = DreamApp.getOrFail()
    const encryptOpts = dreamApp.encryption?.columns
    if (!encryptOpts) throw new MissingColumnEncryptionOpts()

    if (data === null || data === undefined) return null

    return this.doDecryption(data, encryptOpts.current, encryptOpts.legacy)
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
    legacyEncryptionOpts?: DecryptOptions
  ) {
    return Encrypt.decrypt(data, encryptionOpts, legacyEncryptionOpts)
  }
}
