import MissingEncryptionKey from '../exceptions/encrypt/missing-encryption-key'
import decryptAES256GCM from './algorithms/aes-256-gcm/decryptAES256GCM'
import encryptAES256GCM from './algorithms/aes-256-gcm/encryptAES256GCM'
import generateKeyAES256GCM from './algorithms/aes-256-gcm/generateKeyAES256GCM'
import validateKeyAES256GCM from './algorithms/aes-256-gcm/validateKeyAES256GCM'
//
export default class Encrypt {
  public static encrypt(data: any, { algorithm, key }: EncryptOptions): string {
    if (!key) throw new MissingEncryptionKey()

    switch (algorithm) {
      case 'aes-256-gcm':
        return encryptAES256GCM(data, key)
      default:
        throw new Error(`unrecognized algorith provided to encrypt: ${algorithm as string}`)
    }
  }

  public static decrypt<RetType>(encrypted: string, { algorithm, key }: DecryptOptions): RetType | null {
    if (!key) throw new MissingEncryptionKey()
    if ([null, undefined].includes(encrypted as unknown as null)) return null

    switch (algorithm) {
      case 'aes-256-gcm':
        return decryptAES256GCM(encrypted, key)
      default:
        throw new Error(`unrecognized algorith provided to decrypt: ${algorithm as string}`)
    }
  }

  public static generateKey(algorithm: EncryptAlgorithm) {
    switch (algorithm) {
      case 'aes-256-gcm':
        return generateKeyAES256GCM()
      default:
        throw new Error(`unrecognized algorithm provided to generateKey: ${algorithm as string}`)
    }
  }

  public static validateKey(base64EncodedKey: string, algorithm: EncryptAlgorithm) {
    switch (algorithm) {
      case 'aes-256-gcm':
        return validateKeyAES256GCM(base64EncodedKey)
      default:
        throw new Error(`unrecognized algorith provided to validateKey: ${algorithm as string}`)
    }
  }
}

export interface EncryptOptions extends BaseOptions {}
export interface DecryptOptions extends BaseOptions {}
interface BaseOptions {
  algorithm: EncryptAlgorithm
  key: string
}
export type EncryptAlgorithm = 'aes-256-gcm'

export interface PsychicEncryptionPayload {
  ciphertext: string
  tag: string
  iv: string
}
