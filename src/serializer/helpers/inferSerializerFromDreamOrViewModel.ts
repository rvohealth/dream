import DreamApp from '../../dream-app/index.js'
import Dream from '../../Dream.js'
import MissingSerializersDefinition from '../../errors/serializers/MissingSerializersDefinition.js'
import MissingSerializersDefinitionForKey from '../../errors/serializers/MissingSerializersDefinitionForKey.js'
import NoGlobalSerializerForSpecifiedKey from '../../errors/serializers/NoGlobalSerializerForSpecifiedKey.js'
import { ViewModel, ViewModelClass } from '../../types/dream.js'
import { DEFAULT_SERIALIZER_KEY, SerializerType } from '../index.js'

export default function inferSerializerFromDreamOrViewModel(
  obj: Dream | ViewModel,
  serializerKey: string | undefined = DEFAULT_SERIALIZER_KEY
): SerializerType {
  const serializers = (obj as ViewModel).serializers
  if (!serializers) throw new MissingSerializersDefinition(obj)

  const globalName = serializers[serializerKey]
  if (!globalName) throw new MissingSerializersDefinitionForKey(obj, serializerKey)

  const dreamApp = DreamApp.getOrFail()
  const serializer = dreamApp.serializers[globalName]
  if (!serializer) throw new NoGlobalSerializerForSpecifiedKey(obj, serializerKey, globalName)

  return serializer
}

export function inferSerializerFromDreamClassOrViewModelClass(
  classDef: typeof Dream | ViewModelClass,
  serializerKey: string | undefined = undefined
) {
  return inferSerializerFromDreamOrViewModel(classDef.prototype, serializerKey)
}
