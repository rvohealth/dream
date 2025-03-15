import * as crypto from 'crypto'
import { EncryptAESAlgorithm } from '../../index.js'

export default function encryptAESGCM(algorithm: EncryptAESAlgorithm, data: any, key: string): string {
  const iv = crypto.randomBytes(12).toString('base64')
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(key, 'base64') as any,
    Buffer.from(iv, 'base64') as any
  )

  let ciphertext = cipher.update(JSON.stringify(data), 'utf8', 'base64')
  ciphertext += cipher.final('base64')

  const tag = cipher.getAuthTag().toString('base64')

  return Buffer.from(JSON.stringify({ ciphertext, iv, tag })).toString('base64')
}
