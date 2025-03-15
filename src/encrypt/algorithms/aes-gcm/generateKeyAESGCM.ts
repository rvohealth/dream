import * as crypto from 'crypto'
import { EncryptAESBitSize } from '../../index.js.js'

export default function generateKeyAESGCM(bitSize: EncryptAESBitSize): string {
  return crypto.randomBytes(bitSize / 8).toString('base64')
}
