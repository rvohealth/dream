import { SerializableClassOrSerializerCallback, SerializableDreamOrViewModel } from '../../../dream/types'

export default function (dreamOrSerializerClass: SerializableClassOrSerializerCallback): boolean {
  try {
    return !!(dreamOrSerializerClass?.prototype as SerializableDreamOrViewModel)?.serializers
  } catch {
    return false
  }
}
