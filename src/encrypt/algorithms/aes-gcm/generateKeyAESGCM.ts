import crypto from 'crypto'
import { EncryptAESBitSize } from '../..'

export default function generateKeyAESGCM(bitSize: EncryptAESBitSize): string {
  return crypto.randomBytes(bitSize / 8).toString('base64')
}
