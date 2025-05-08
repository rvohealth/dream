import { SerializableClassOrSerializerCallback, ViewModel } from '../../../types/dream.js'

export default function (dreamOrSerializerClass: SerializableClassOrSerializerCallback): boolean {
  try {
    return !!(dreamOrSerializerClass?.prototype as ViewModel)?.serializers
  } catch {
    return false
  }
}
