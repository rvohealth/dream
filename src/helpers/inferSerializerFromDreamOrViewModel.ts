import { DreamClassOrViewModelClass, DreamOrViewModel } from '../dream/types'

export default function inferSerializerFromDreamOrViewModel(
  obj: DreamOrViewModel,
  serializerKey: string | undefined = undefined
) {
  return obj?.serializers?.[serializerKey || 'default'] || null
}

export function inferSerializerFromDreamClassOrViewModelClass(
  classDef: DreamClassOrViewModelClass,
  serializerKey: string | undefined = undefined
) {
  return inferSerializerFromDreamOrViewModel(classDef.prototype, serializerKey)
}
