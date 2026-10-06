import DecryptionError from '../errors/encrypt/DecryptionError.js'
import DecryptionRotationError from '../errors/encrypt/DecryptionRotationError.js'
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
   * `DecryptionRotationError` carrying both per-key errors. A
   * `DecryptionParseError` from the current key is **not** retried — the
   * cipher already matched, so a parse failure means the encrypted format
   * is wrong (an app bug), not a wrong key.
   *
   * `MissingEncryptionKey` propagates from either form when a key is missing.
   *
   * **`onLegacyKeyUsed`** (optional fourth argument): during a key rotation,
   * tells you which values still need the legacy key. It is called with no
   * arguments, synchronously, before a three-arg call returns a value that
   * the legacy key opened. It is not called when the current key opens the
   * value, when decryption throws, or in the two-arg form. An error it
   * throws propagates from `decrypt` as is.
   *
   * ```ts
   * const value = Encrypt.decrypt<string>(
   *   encrypted,
   *   { algorithm: 'aes-256-gcm', key: newKey },
   *   { algorithm: 'aes-256-gcm', key: oldKey },
   *   { onLegacyKeyUsed: () => console.warn('this value is still encrypted with the old key') }
   * )
   * ```
   *
   * @throws MissingEncryptionKey
   * @throws DecryptionError
   * @throws DecryptionParseError
   * @throws DecryptionRotationError
   */
  public static decrypt<RetType>(
    encrypted: string,
    { algorithm, key }: DecryptOptions,
    legacyOpts?: DecryptOptions,
    { onLegacyKeyUsed }: DecryptCallbacks = {}
  ): RetType | null {
    if (legacyOpts)
      return this.attemptDecryptionWithLegacyKeys(encrypted, { algorithm, key }, legacyOpts, onLegacyKeyUsed)

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
    legacyOpts: DecryptOptions,
    onLegacyKeyUsed: (() => void) | undefined
  ): RetType | null {
    let currentKeyError: DecryptionError
    try {
      return this.decrypt<RetType>(encrypted, currentOpts)
    } catch (err) {
      if (!(err instanceof DecryptionError)) throw err
      currentKeyError = err
    }

    let decrypted: RetType | null
    try {
      decrypted = this.decrypt<RetType>(encrypted, legacyOpts)
    } catch (err) {
      if (!(err instanceof DecryptionError)) throw err
      throw new DecryptionRotationError(currentKeyError, err)
    }

    // called outside the try above, so an error the callback throws is never
    // mistaken for the legacy key failing
    onLegacyKeyUsed?.()
    return decrypted
  }

  /**
   * Generates a base64-encoded random key suitable for the given algorithm.
   *
   * ## Rotation workflow
   *
   * 1. Generate a new key: `const newKey = Encrypt.generateKey('aes-256-gcm')`.
   * 2. Configure rotation by setting both `current` and `legacy`. For
   *    encrypted columns: `dreamApp.set('encryption', { columns: { current:
   *    { algorithm: 'aes-256-gcm', key: newKey }, legacy: { algorithm:
   *    'aes-256-gcm', key: oldKey } } })`. For cookies, use the equivalent
   *    shape under `psychicApp.set('encryption', { cookies: { current,
   *    legacy } })`.
   * 3. Deploy. New encryptions use `current`; existing ciphertext continues
   *    to decrypt via `legacy` fallback.
   * 4. For cookies, wait at least the cookie `maxAge` so all in-flight
   *    cookies have either expired or been re-issued under the new key. For
   *    `@Encrypted` columns, re-encrypt every existing row under the new key
   *    with a migration that calls `DreamMigrationHelpers.reencryptColumn`
   *    for each encrypted column. Run it only once every server runs with the
   *    new `current`: a server still on the old `current` keeps writing
   *    old-key values that the helper's single pass over the table can miss.
   *    Writing old-key ciphertext straight into a backing column
   *    (`setAttribute`, `setAttributes` or `updateAttributes` given the
   *    backing column) after the helper has run also puts an old-key value
   *    back.
   * 5. Drop `legacy` from config and deploy again.
   *
   * To see which values still need the old key while `legacy` is
   * configured, register `dreamApp.on('encryption:legacy-key-used', ...)`,
   * which fires each time reading an `@Encrypted` property needed `legacy`
   * to open the value, or pass `onLegacyKeyUsed` to {@link Encrypt.decrypt}
   * for values you decrypt yourself. A value nobody reads never fires
   * either, so silence alone does not show that `legacy` is safe to drop.
   *
   * ## When to rotate
   *
   * - On a scheduled cadence (90–180 days is a reasonable policy default).
   * - Incident response: leaked env file, departing employee with key
   *   access, or any suspected key compromise.
   *
   * ## How long to keep `legacy`
   *
   * - For cookies: at least the cookie `maxAge`, so in-flight sessions are
   *   not forced to re-authenticate.
   * - For `@Encrypted` columns: until every existing row has been
   *   re-encrypted under the new key. Dropping `legacy` early will cause
   *   `DecryptionRotationError` on any not-yet-rewritten row.
   */
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

export interface DecryptCallbacks {
  /**
   * Called with no arguments, synchronously, before a three-arg
   * {@link Encrypt.decrypt} returns a value that the legacy key opened.
   * Never called when the current key opens the value, when decryption
   * throws, or in the two-arg form.
   */
  onLegacyKeyUsed?: () => void
}

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
