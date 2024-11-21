import Encrypt, { DecryptOptions, EncryptOptions } from '.'
import DreamApplication from '../dream-application'
import MissingColumnEncryptionOpts from '../exceptions/encrypt/MissingColumnEncryptionOpts'

export default class InternalEncrypt {
  public static encryptColumn(data: any) {
    const dreamApp = DreamApplication.getOrFail()
    const encryptOpts = dreamApp.encryption?.columns
    if (!encryptOpts) throw new MissingColumnEncryptionOpts()

    if (data === null || data === undefined) return null

    return this.doEncryption(data, encryptOpts.current)
  }

  public static decryptColumn(data: any) {
    const dreamApp = DreamApplication.getOrFail()
    const encryptOpts = dreamApp.encryption?.columns
    if (!encryptOpts) throw new MissingColumnEncryptionOpts()

    if (data === null || data === undefined) return null

    return this.doDecryption(data, encryptOpts.current, encryptOpts.legacy)
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
