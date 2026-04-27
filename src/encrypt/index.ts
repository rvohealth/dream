import DecryptionError from '../errors/encrypt/DecryptionError.js'
import DecryptionWithRotationError from '../errors/encrypt/DecryptionWithRotationError.js'
import MissingEncryptionKey from '../errors/encrypt/MissingEncryptionKey.js'
import decryptAESGCM from './algorithms/aes-gcm/decryptAESGCM.js'
import encryptAESGCM from './algorithms/aes-gcm/encryptAESGCM.js'
import generateKeyAESGCM from './algorithms/aes-gcm/generateKeyAESGCM.js'
import validateKeyAESGCM from './algorithms/aes-gcm/validateKeyAESGCM.js'
//
export default class Encrypt {
  public static encrypt(data: any, { algorithm, key }: EncryptOptions): string {
    if (!key) throw new MissingEncryptionKey()

    switch (algorithm) {
      case 'aes-256-gcm':
      case 'aes-192-gcm':
      case 'aes-128-gcm':
        return encryptAESGCM(algorithm, data, key)

      default: {
        // protection so that if a new EncryptAlgorithm is ever added, this will throw a type error at build time
        const _never: never = algorithm
        throw new Error(`Unhandled EncryptAlgorithm: ${_never as string}`)
      }
    }
  }

  /**
   * Decrypts a value previously produced by {@link Encrypt.encrypt}.
   *
   * Behavior depends on whether `legacyOpts` is provided:
   *
   * **Two-arg form** (no rotation):
   * - `null`/`undefined` input returns `null`.
   * - Cipher op / auth tag / payload-shape failure throws `DecryptionError`.
   * - Successful decrypt with non-JSON plaintext throws `DecryptionParseError`.
   *
   * **Three-arg form** (rotation): tries the current key first; on
   * `DecryptionError` falls back to the legacy key. If both fail, throws
   * `DecryptionWithRotationError` carrying both per-key errors. A
   * `DecryptionParseError` from the current key is **not** retried — the
   * cipher already matched, so a parse failure means the encrypted format
   * is wrong (an app bug), not a wrong key.
   *
   * `MissingEncryptionKey` propagates from either form when a key is missing.
   *
   * @throws MissingEncryptionKey
   * @throws DecryptionError
   * @throws DecryptionParseError
   * @throws DecryptionWithRotationError
   */
  public static decrypt<RetType>(
    encrypted: string,
    { algorithm, key }: DecryptOptions,
    legacyOpts?: DecryptOptions
  ): RetType | null {
    if (legacyOpts) return this.attemptDecryptionWithLegacyKeys(encrypted, { algorithm, key }, legacyOpts)

    if (!key) throw new MissingEncryptionKey()
    if ([null, undefined].includes(encrypted as unknown as null)) return null

    switch (algorithm) {
      case 'aes-256-gcm':
      case 'aes-192-gcm':
      case 'aes-128-gcm':
        return decryptAESGCM(algorithm, encrypted, key)

      default: {
        // protection so that if a new EncryptAlgorithm is ever added, this will throw a type error at build time
        const _never: never = algorithm
        throw new Error(`Unhandled EncryptAlgorithm: ${_never as string}`)
      }
    }
  }

  private static attemptDecryptionWithLegacyKeys<RetType>(
    encrypted: string,
    currentOpts: DecryptOptions,
    legacyOpts: DecryptOptions
  ): RetType | null {
    let currentKeyError: DecryptionError
    try {
      return this.decrypt<RetType>(encrypted, currentOpts)
    } catch (err) {
      if (!(err instanceof DecryptionError)) throw err
      currentKeyError = err
    }

    try {
      return this.decrypt<RetType>(encrypted, legacyOpts)
    } catch (err) {
      if (!(err instanceof DecryptionError)) throw err
      throw new DecryptionWithRotationError(currentKeyError, err)
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

      default: {
        // protection so that if a new EncryptAlgorithm is ever added, this will throw a type error at build time
        const _never: never = algorithm
        throw new Error(`Unhandled EncryptAlgorithm: ${_never as string}`)
      }
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

      default: {
        // protection so that if a new EncryptAlgorithm is ever added, this will throw a type error at build time
        const _never: never = algorithm
        throw new Error(`Unhandled EncryptAlgorithm: ${_never as string}`)
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EncryptOptions extends BaseOptions {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DecryptOptions extends BaseOptions {}

interface BaseOptions {
  algorithm: EncryptAlgorithm
  key: string
}
export type EncryptAESAlgorithm = 'aes-256-gcm' | 'aes-192-gcm' | 'aes-128-gcm'
export type EncryptAlgorithm = EncryptAESAlgorithm
export type EncryptAESBitSize = 256 | 192 | 128

export interface PsychicEncryptionPayload {
  ciphertext: string
  tag: string
  iv: string
}
