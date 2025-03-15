import { EncryptAESBitSize } from '../../index.js'

export default function validateKeyAESGCM(base64EncodedKey: string, bitSize: EncryptAESBitSize): boolean {
  try {
    return Buffer.from(base64EncodedKey, 'base64')?.length === bitSize / 8
  } catch {
    return false
  }
}
