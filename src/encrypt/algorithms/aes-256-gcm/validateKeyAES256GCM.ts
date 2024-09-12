export default function validateKeyAES256GCM(base64EncodedKey: string): boolean {
  try {
    return Buffer.from(base64EncodedKey, 'base64')?.length === 32
  } catch {
    return false
  }
}
