import * as crypto from 'crypto'
import { EncryptAESAlgorithm, PsychicEncryptionPayload } from '../..'

export default function decryptAESGCM<RetType>(
  algorithm: EncryptAESAlgorithm,
  encrypted: string,
  key: string
): RetType | null {
  const { ciphertext, tag, iv } = unpackPayloadOrFail(encrypted)

  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(key, 'base64') as any,
    Buffer.from(iv, 'base64') as any
  )
  decipher.setAuthTag(Buffer.from(tag, 'base64') as any)

  let plaintext = decipher.update(ciphertext, 'base64', 'utf8')
  plaintext += decipher.final('utf8')

  return JSON.parse(plaintext) as RetType
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
