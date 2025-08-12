import Dream from '../../Dream.js'
import DreamSerializerBuilder from '../builders/DreamSerializerBuilder.js'
import ObjectSerializerBuilder from '../builders/ObjectSerializerBuilder.js'

export default function isDreamSerializer(dreamOrSerializerClass: any): boolean {
  if (!dreamOrSerializerClass) return false

  const asDream = dreamOrSerializerClass as Dream
  if (asDream instanceof Dream) return false
  if (typeof dreamOrSerializerClass !== 'function') return false

  try {
    const serializer = dreamOrSerializerClass(undefined as any, undefined as any)
    return serializer instanceof DreamSerializerBuilder || serializer instanceof ObjectSerializerBuilder
  } catch {
    return false
  }
}
