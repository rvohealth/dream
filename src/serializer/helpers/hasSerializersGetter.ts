import { ViewModel } from '../../types/dream.js'
import { SerializableClassOrSerializerCallback } from '../../types/serializer.js'

// TODO: delete this file if no longer used
export default function hasSerializersGetter(
  dreamOrSerializerClass: SerializableClassOrSerializerCallback
): boolean {
  try {
    return !!(dreamOrSerializerClass?.prototype as ViewModel)?.serializers
  } catch {
    return false
  }
}
