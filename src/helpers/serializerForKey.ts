import Dream from '../dream'

export default function instanceSerializerForKey(
  obj: unknown,
  serializerKey: string | undefined = undefined
) {
  if (!obj) return null
  const serializerClassMap = (obj as Dream).serializers

  if (serializerClassMap) return (serializerClassMap as any)[serializerKey || 'default']

  return null
}

export function classSerializerForKey(classDef: unknown, serializerKey: string | undefined = undefined) {
  if (!classDef) return null
  const serializerClassMap = (classDef as typeof Dream).prototype.serializers

  if (serializerClassMap) return (serializerClassMap as any)[serializerKey || 'default']

  return null
}
