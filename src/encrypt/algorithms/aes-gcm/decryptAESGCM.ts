import * as crypto from 'crypto'
import DecryptionError from '../../../errors/encrypt/DecryptionError.js'
import DecryptionParseError from '../../../errors/encrypt/DecryptionParseError.js'
import { EncryptAESAlgorithm, PsychicEncryptionPayload } from '../../index.js'

export default function decryptAESGCM<RetType>(
  algorithm: EncryptAESAlgorithm,
  encrypted: string,
  key: string
): RetType {
  const { ciphertext, tag, iv } = unpackPayloadOrFail(encrypted)

  let plaintext: string
  try {
    const decipher = crypto.createDecipheriv(
      algorithm,
      Buffer.from(key, 'base64') as any,
      Buffer.from(iv, 'base64') as any
    )
    decipher.setAuthTag(Buffer.from(tag, 'base64') as any)

    // Decrypt to a complete plaintext Buffer and decode utf8 once, mirroring the
    // Buffer-based encrypt path. The incremental string form (update(..., 'base64',
    // 'utf8') + final('utf8')) can split a multibyte UTF-8 character across the
    // update/final boundary and is subject to the same Deno node:crypto string-encoding
    // bug.
    plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8')
  } catch (cause) {
    // The cipher's error is kept as `cause`: its messages carry no input bytes, and
    // callers read its `code` (e.g. ERR_CRYPTO_INVALID_KEYLEN to tell a misconfigured
    // key from an undecryptable value).
    throw Object.assign(new DecryptionError(), { cause })
  }

  try {
    return JSON.parse(plaintext) as RetType
  } catch {
    // Intentionally drop the underlying SyntaxError as `cause`: its message embeds a
    // snippet of the just-decrypted plaintext (e.g. `Unexpected token 'x', "secret..." is
    // not valid JSON`). Carrying it would leak decrypted plaintext into any logger that
    // serializes `error.cause`. DecryptionParseError's own message is generic and
    // plaintext-free, which is all callers need to diagnose an encrypted-format mismatch.
    throw new DecryptionParseError()
  }
}

// Every way the envelope can be malformed throws DecryptionError with no `cause`. The
// encrypted value is caller input (a cookie, a token, a column that was never
// encrypted), and the errors that unpacking it raises quote it: JSON.parse's
// SyntaxError embeds a snippet of the decoded text, and Buffer.from's TypeError on a
// non-string field echoes the field's value. Checking every field is a string here
// means the cipher operations in decryptAESGCM only ever see strings.
function unpackPayloadOrFail(payload: string | object): PsychicEncryptionPayload {
  let unpackedPayload: unknown
  try {
    unpackedPayload =
      typeof payload === 'string' ? JSON.parse(Buffer.from(payload, 'base64').toString()) : payload
  } catch {
    throw new DecryptionError()
  }

  if (typeof unpackedPayload !== 'object' || unpackedPayload === null) throw new DecryptionError()

  const { ciphertext, tag, iv } = unpackedPayload as Record<string, unknown>
  if (!isNonEmptyString(ciphertext) || !isNonEmptyString(tag) || !isNonEmptyString(iv))
    throw new DecryptionError()

  return { ciphertext, tag, iv }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}
