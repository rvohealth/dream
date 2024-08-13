import Dream from '../dream'
import { getCachedDreamApplicationOrFail } from '../dream-application/cache'
import { DreamClassOrViewModelClass, DreamOrViewModel } from '../dream/types'
import DreamSerializer from '../serializer'

export default function inferSerializerFromDreamOrViewModel(
  obj: DreamOrViewModel,
  serializerKey: string | undefined = undefined
) {
  const globalName =
    (obj as Dream | { serializers: Record<string, typeof DreamSerializer> })?.['serializers']?.[
      serializerKey || 'default'
    ] || null

  const dreamApp = getCachedDreamApplicationOrFail()
  return dreamApp.serializers[globalName] || null
}

export function inferSerializerFromDreamClassOrViewModelClass(
  classDef: DreamClassOrViewModelClass,
  serializerKey: string | undefined = undefined
) {
  return inferSerializerFromDreamOrViewModel(classDef.prototype, serializerKey)
}
