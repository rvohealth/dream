import crypto from 'crypto'

export default function generateKeyAES256GCM(): string {
  return crypto.randomBytes(32).toString('base64')
}
