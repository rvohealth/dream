import generateKeyAESGCM from '../aes-gcm/generateKeyAESGCM'

export default function generateKeyAES256GCM(): string {
  return generateKeyAESGCM(256)
}
