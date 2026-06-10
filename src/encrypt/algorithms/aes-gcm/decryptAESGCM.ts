import * as crypto from 'crypto'
import DecryptionError from '../../../errors/encrypt/DecryptionError.js'
import DecryptionParseError from '../../../errors/encrypt/DecryptionParseError.js'
import { EncryptAESAlgorithm, PsychicEncryptionPayload } from '../../index.js'

export default function decryptAESGCM<RetType>(
  algorithm: EncryptAESAlgorithm,
  encrypted: string,
  key: string
): RetType {
  let plaintext: string
  try {
    const { ciphertext, tag, iv } = unpackPayloadOrFail(encrypted)

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
    throw Object.assign(new DecryptionError(), { cause })
  }

  try {
    return JSON.parse(plaintext) as RetType
  } catch (cause) {
    throw Object.assign(new DecryptionParseError(), { cause })
  }
}

function unpackPayloadOrFail(payload: string | object) {
  const unpackedPayload = (
    typeof payload === 'string' ? JSON.parse(Buffer.from(payload, 'base64').toString()) : payload
  ) as PsychicEncryptionPayload

  if (typeof unpackedPayload !== 'object') {
    throw new Error('Failed to unpack encrypted object. Must be an object with a ciphertext and tag property')
  }

  const { ciphertext, tag, iv } = unpackedPayload
  if (!ciphertext) throw new Error('invalid ciphertext found')
  if (!tag) throw new Error('invalid tag found')
  if (!iv) throw new Error('missing iv')

  return { ciphertext, tag, iv }
}
