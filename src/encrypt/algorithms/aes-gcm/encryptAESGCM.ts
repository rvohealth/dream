import * as crypto from 'crypto'
import { EncryptAESAlgorithm } from '../../index.js'

export default function encryptAESGCM(algorithm: EncryptAESAlgorithm, data: any, key: string): string {
  const iv = crypto.randomBytes(12).toString('base64')
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(key, 'base64') as any,
    Buffer.from(iv, 'base64') as any
  )

  // Build the ciphertext as raw bytes and base64-encode it once, rather than letting the
  // cipher emit base64 incrementally (update(..., 'base64') + final('base64')). base64
  // encodes in 3-byte groups, so encoding the update and final chunks separately and
  // concatenating the strings is not equivalent to encoding the whole byte stream when the
  // split lands mid-group. Node tolerates it; Deno's node:crypto drops the trailing partial
  // group, truncating the ciphertext and failing the GCM auth tag on decrypt. Encoding the
  // complete Buffer once is correct on every runtime and is byte-identical to the previous
  // Node output, so values encrypted by earlier versions still decrypt.
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(data), 'utf8')),
    cipher.final(),
  ]).toString('base64')

  const tag = cipher.getAuthTag().toString('base64')

  return Buffer.from(JSON.stringify({ ciphertext, iv, tag })).toString('base64')
}
