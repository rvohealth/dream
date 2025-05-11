import Dream from '../../Dream.js'

export default function isDreamSerializer(dreamOrSerializerClass: any): boolean {
  if (!dreamOrSerializerClass) return false

  const asDream = dreamOrSerializerClass as Dream
  if (asDream.isDreamInstance) return false
  if (typeof dreamOrSerializerClass !== 'function') return false

  try {
    const serializer = dreamOrSerializerClass(undefined as any, undefined as any)
    return !!serializer?.isSerializer
  } catch {
    return false
  }
}
