import Dream from '../dream'
import { getCachedDreamApplicationOrFail } from '../dream-application/cache'
import { SerializableDreamClassOrViewModelClass, SerializableDreamOrViewModel } from '../dream/types'

export default function inferSerializerFromDreamOrViewModel(
  obj: Dream | SerializableDreamOrViewModel,
  serializerKey: string | undefined = undefined
) {
  const globalName =
    (obj as SerializableDreamOrViewModel)?.['serializers']?.[serializerKey || 'default'] || null

  if (globalName) {
    const dreamApp = getCachedDreamApplicationOrFail()
    return dreamApp.serializers[globalName] || null
  }

  return null
}

export function inferSerializerFromDreamClassOrViewModelClass(
  classDef: SerializableDreamClassOrViewModelClass,
  serializerKey: string | undefined = undefined
) {
  return inferSerializerFromDreamOrViewModel(classDef.prototype, serializerKey)
}
