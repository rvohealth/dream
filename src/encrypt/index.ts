import MissingEncryptionKey from '../exceptions/encrypt/missing-encryption-key'
import decryptAESGCM from './algorithms/aes-gcm/decryptAESGCM'
import encryptAESGCM from './algorithms/aes-gcm/encryptAESGCM'
import generateKeyAESGCM from './algorithms/aes-gcm/generateKeyAESGCM'
import validateKeyAESGCM from './algorithms/aes-gcm/validateKeyAESGCM'
//
export default class Encrypt {
  public static encrypt(data: any, { algorithm, key }: EncryptOptions): string {
    if (!key) throw new MissingEncryptionKey()

    switch (algorithm) {
      case 'aes-256-gcm':
      case 'aes-192-gcm':
      case 'aes-128-gcm':
        return encryptAESGCM(algorithm, data, key)

      default:
        throw new Error(`unrecognized algorith provided to encrypt: ${algorithm as string}`)
    }
  }

  public static decrypt<RetType>(encrypted: string, { algorithm, key }: DecryptOptions): RetType | null {
    if (!key) throw new MissingEncryptionKey()
    if ([null, undefined].includes(encrypted as unknown as null)) return null

    switch (algorithm) {
      case 'aes-256-gcm':
      case 'aes-192-gcm':
      case 'aes-128-gcm':
        return decryptAESGCM(algorithm, encrypted, key)

      default:
        throw new Error(`unrecognized algorith provided to decrypt: ${algorithm as string}`)
    }
  }

  public static generateKey(algorithm: EncryptAlgorithm) {
    switch (algorithm) {
      case 'aes-256-gcm':
        return generateKeyAESGCM(256)

      case 'aes-192-gcm':
        return generateKeyAESGCM(192)

      case 'aes-128-gcm':
        return generateKeyAESGCM(128)

      default:
        throw new Error(`unrecognized algorithm provided to generateKey: ${algorithm as string}`)
    }
  }

  public static validateKey(base64EncodedKey: string, algorithm: EncryptAlgorithm) {
    switch (algorithm) {
      case 'aes-256-gcm':
        return validateKeyAESGCM(base64EncodedKey, 256)

      case 'aes-192-gcm':
        return validateKeyAESGCM(base64EncodedKey, 192)

      case 'aes-128-gcm':
        return validateKeyAESGCM(base64EncodedKey, 128)

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
export type EncryptAlgorithm = 'aes-256-gcm' | 'aes-192-gcm' | 'aes-128-gcm'
export type EncryptAESBitSize = 256 | 192 | 128

export interface PsychicEncryptionPayload {
  ciphertext: string
  tag: string
  iv: string
}
