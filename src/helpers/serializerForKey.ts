import Dream from '../dream'
import DreamSerializer from '../serializer'

export default function serializerForKey(classDef: unknown, serializerKey: string | undefined = undefined) {
  if (!classDef) return null
  const serializerClassMap = (classDef as typeof Dream).prototype.serializers

  if (serializerClassMap) {
    const serializerClass =
      serializerClassMap[(serializerKey || 'default') as keyof typeof serializerClassMap]
    if (serializerClass !== DreamSerializer) return serializerClass
  }

  return null
}
