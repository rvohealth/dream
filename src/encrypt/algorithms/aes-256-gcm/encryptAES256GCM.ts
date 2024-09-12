import crypto from 'crypto'

export default function encryptAES256GCM(data: any, key: string): string {
  const iv = crypto.randomBytes(12).toString('base64')
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'))

  let ciphertext = cipher.update(JSON.stringify(data), 'utf8', 'base64')
  ciphertext += cipher.final('base64')

  const tag = cipher.getAuthTag().toString('base64')

  return Buffer.from(JSON.stringify({ ciphertext, iv, tag })).toString('base64')
}
