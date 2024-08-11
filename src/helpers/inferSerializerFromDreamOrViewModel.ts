import Dream from '../dream'
import { DreamClassOrViewModelClass, DreamOrViewModel } from '../dream/types'
import DreamSerializer from '../serializer'

export default function inferSerializerFromDreamOrViewModel(
  obj: DreamOrViewModel,
  serializerKey: string | undefined = undefined
) {
  return inferSerializerFromDreamClassOrViewModelClass(obj.constructor as typeof Dream, serializerKey)
}

export function inferSerializerFromDreamClassOrViewModelClass(
  classDef: DreamClassOrViewModelClass,
  serializerKey: string | undefined = undefined
) {
  return (
    (classDef as typeof Dream)['serializers']?.[serializerKey || 'default'] ||
    (classDef as { serializers: Record<string, typeof DreamSerializer> })?.['serializers']?.[
      serializerKey || 'default'
    ] ||
    null
  )
}
