import decryptAESGCM from '../aes-gcm/decryptAESGCM'

export default function decryptAES256GCM<RetType>(encrypted: string, key: string): RetType | null {
  return decryptAESGCM('aes-256-gcm', encrypted, key)
}
