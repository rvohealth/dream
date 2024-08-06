import Dream from '../dream'
import { DreamClassOrViewModelClass, DreamOrViewModel } from '../dream/types'
import DreamSerializer from '../serializer'

export default function inferSerializerFromDreamOrViewModel(
  obj: DreamOrViewModel,
  serializerKey: string | undefined = undefined
) {
  return (
    (obj?.constructor as typeof Dream)?.['serializers']?.[serializerKey || 'default'] ||
    (obj as { serializers: Record<string, typeof DreamSerializer> })?.['serializers']?.[
      serializerKey || 'default'
    ] ||
    null
  )
}

export function inferSerializerFromDreamClassOrViewModelClass(
  classDef: DreamClassOrViewModelClass,
  serializerKey: string | undefined = undefined
) {
  return inferSerializerFromDreamOrViewModel(classDef.prototype, serializerKey)
}
