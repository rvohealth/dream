import DreamApp from '../../dream-app/index.js'
import Dream from '../../Dream.js'
import MissingSerializersDefinition from '../../errors/serializers/MissingSerializersDefinition.js'
import MissingSerializersDefinitionForKey from '../../errors/serializers/MissingSerializersDefinitionForKey.js'
import NoGlobalSerializerForSpecifiedKey from '../../errors/serializers/NoGlobalSerializerForSpecifiedKey.js'
import { ViewModel, ViewModelClass } from '../../types/dream.js'
import { SerializerType } from '../../types/serializer.js'
import { DEFAULT_SERIALIZER_KEY } from '../index.js'

export default function inferSerializerFromDreamOrViewModel<
  T extends Dream | ViewModel | null | undefined,
  ReturnType extends T extends null | undefined
    ? null
    : T extends Dream | ViewModel
      ? SerializerType<T>
      : never,
>(obj: T, serializerKey: string | undefined = DEFAULT_SERIALIZER_KEY): ReturnType {
  if (!obj) return null as ReturnType
  const serializers = (obj as ViewModel).serializers
  if (!serializers) throw new MissingSerializersDefinition(obj)

  const globalName = serializers[serializerKey]
  if (!globalName) throw new MissingSerializersDefinitionForKey(obj, serializerKey)

  const dreamApp = DreamApp.getOrFail()
  const serializer = dreamApp.serializers[globalName]
  if (!serializer) throw new NoGlobalSerializerForSpecifiedKey(obj, serializerKey, globalName)

  return serializer as ReturnType
}

export function inferSerializerFromDreamClassOrViewModelClass(
  classDef: typeof Dream | ViewModelClass,
  serializerKey: string | undefined = undefined
) {
  return inferSerializerFromDreamOrViewModel(classDef.prototype, serializerKey)!
}
