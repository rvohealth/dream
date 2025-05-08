import Dream from '../Dream.js'
import DreamApp from '../dream-app/index.js'
import { ViewModel, ViewModelClass } from '../types/dream.js'

export default function inferSerializerFromDreamOrViewModel(
  obj: Dream | ViewModel,
  serializerKey: string | undefined = undefined
) {
  const globalName = (obj as ViewModel)?.['serializers']?.[serializerKey || 'default'] || null

  if (globalName) {
    const dreamApp = DreamApp.getOrFail()
    return dreamApp.serializers[globalName] || null
  }

  return null
}

export function inferSerializerFromDreamClassOrViewModelClass(
  classDef: ViewModelClass,
  serializerKey: string | undefined = undefined
) {
  return inferSerializerFromDreamOrViewModel(classDef.prototype, serializerKey)
}
