import Dream from '../Dream.js.js'
import DreamApplication from '../dream-application/index.js.js'
import { SerializableDreamClassOrViewModelClass, SerializableDreamOrViewModel } from '../dream/types.js.js'

export default function inferSerializerFromDreamOrViewModel(
  obj: Dream | SerializableDreamOrViewModel,
  serializerKey: string | undefined = undefined
) {
  const globalName =
    (obj as SerializableDreamOrViewModel)?.['serializers']?.[serializerKey || 'default'] || null

  if (globalName) {
    const dreamApp = DreamApplication.getOrFail()
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
