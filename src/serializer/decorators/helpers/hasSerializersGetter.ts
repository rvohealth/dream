import { SerializableClass, SerializableDreamOrViewModel } from '../../../dream/types'

export default function (dreamOrSerializerClass: SerializableClass): boolean {
  try {
    return !!(dreamOrSerializerClass?.prototype as SerializableDreamOrViewModel)?.serializers
  } catch {
    return false
  }
}
