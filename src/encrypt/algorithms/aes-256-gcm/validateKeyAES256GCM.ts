import validateKeyAESGCM from '../aes-gcm/validateKeyAESGCM'

export default function validateKeyAES256GCM(base64EncodedKey: string): boolean {
  return validateKeyAESGCM(base64EncodedKey, 256)
}
