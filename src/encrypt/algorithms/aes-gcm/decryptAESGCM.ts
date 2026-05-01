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

    plaintext = decipher.update(ciphertext, 'base64', 'utf8')
    plaintext += decipher.final('utf8')
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
