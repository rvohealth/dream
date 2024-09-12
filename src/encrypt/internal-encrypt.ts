import Encrypt, { DecryptOptions, EncryptOptions } from '.'
import DreamApplication from '../dream-application'
import FailedToDecryptColumn from '../exceptions/encrypt/failed-to-decrypt-column'
import FailedToEncryptColumn from '../exceptions/encrypt/failed-to-encrypt-column'
import MissingColumnEncryptionOpts from '../exceptions/encrypt/missing-column-encryption-opts'

export default class InternalEncrypt {
  public static encryptColumn(data: any) {
    const dreamApp = DreamApplication.getOrFail()
    const encryptOpts = dreamApp.encryption?.columns
    if (!encryptOpts) throw new MissingColumnEncryptionOpts()

    const res = this.doEncryption(data, encryptOpts.current, encryptOpts.legacy)
    if (!res) throw new FailedToEncryptColumn()

    return res
  }

  public static decryptColumn(data: any) {
    const dreamApp = DreamApplication.getOrFail()
    const encryptOpts = dreamApp.encryption?.columns
    if (!encryptOpts) throw new MissingColumnEncryptionOpts()

    const res = this.doDecryption(data, encryptOpts.current, encryptOpts.legacy)
    if (!res) throw new FailedToDecryptColumn()

    return res
  }

  private static doEncryption(
    data: any,
    encryptionOpts: EncryptOptions,
    legacyEncryptionOpts?: EncryptOptions
  ) {
    let res: string | null = null
    try {
      res = Encrypt.encrypt(data, encryptionOpts)
    } catch {
      // noop
    }

    if (res) return res

    if (legacyEncryptionOpts) {
      try {
        res = Encrypt.encrypt(data, legacyEncryptionOpts)
      } catch {
        // noop
      }
    }

    return res
  }

  private static doDecryption(
    data: any,
    encryptionOpts: DecryptOptions,
    legacyEncryptionOpts?: DecryptOptions
  ) {
    let res: string | null = null
    try {
      res = Encrypt.decrypt(data, encryptionOpts)
    } catch {
      // noop
    }

    if (res) return res

    if (legacyEncryptionOpts) {
      try {
        res = Encrypt.decrypt(data, legacyEncryptionOpts)
      } catch {
        // noop
      }
    }

    return res
  }
}
