import Dream from '../dream'

export default function serializerForKey(classDef: unknown, serializerKey: string | undefined = undefined) {
  if (!classDef) return null
  const serializerClassMap = (classDef as typeof Dream).prototype.serializers

  if (serializerClassMap) return (serializerClassMap as any)[serializerKey || 'default']

  return null
}
