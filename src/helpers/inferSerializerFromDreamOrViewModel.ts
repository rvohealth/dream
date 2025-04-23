import Dream from '../Dream.js'
import DreamApp from '../dream-app/index.js'
import { SerializableDreamClassOrViewModelClass, SerializableDreamOrViewModel } from '../types/dream.js'

export default function inferSerializerFromDreamOrViewModel(
  obj: Dream | SerializableDreamOrViewModel,
  serializerKey: string | undefined = undefined
) {
  const globalName =
    (obj as SerializableDreamOrViewModel)?.['serializers']?.[serializerKey || 'default'] || null

  if (globalName) {
    const dreamApp = DreamApp.getOrFail()
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
