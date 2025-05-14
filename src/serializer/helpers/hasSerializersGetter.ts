import { ViewModel } from '../../types/dream.js'
import { SerializableClassOrSerializerCallback } from '../../types/serializer.js'

export default function (dreamOrSerializerClass: SerializableClassOrSerializerCallback): boolean {
  try {
    return !!(dreamOrSerializerClass?.prototype as ViewModel)?.serializers
  } catch {
    return false
  }
}
