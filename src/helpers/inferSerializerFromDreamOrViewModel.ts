import { DreamClassOrViewModelClass, DreamOrViewModel } from '../dream/types'

export default function inferSerializerFromDreamOrViewModel(
  obj: DreamOrViewModel,
  serializerKey: string | undefined = undefined
) {
  if (!obj) return null
  const serializerClassMap = obj.serializers

  if (serializerClassMap) return (serializerClassMap as any)[serializerKey || 'default']

  return null
}

export function inferSerializerFromDreamClassOrViewModelClass(
  classDef: DreamClassOrViewModelClass,
  serializerKey: string | undefined = undefined
) {
  return inferSerializerFromDreamOrViewModel(classDef.prototype, serializerKey)
}
