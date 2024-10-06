import encryptAESGCM from '../aes-gcm/encryptAESGCM'

export default function encryptAES256GCM(data: any, key: string): string {
  return encryptAESGCM('aes-256-gcm', data, key)
}
