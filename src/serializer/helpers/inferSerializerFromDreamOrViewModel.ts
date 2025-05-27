import DreamApp from '../../dream-app/index.js'
import Dream from '../../Dream.js'
import MissingSerializersDefinition from '../../errors/serializers/MissingSerializersDefinition.js'
import MissingSerializersDefinitionForKey from '../../errors/serializers/MissingSerializersDefinitionForKey.js'
import NoGlobalSerializerForSpecifiedKey from '../../errors/serializers/NoGlobalSerializerForSpecifiedKey.js'
import NonDreamSerializerDerivedFromGlobalSerializerForSpecifiedKey from '../../errors/serializers/NonDreamSerializerDerivedFromGlobalSerializerForSpecifiedKey.js'
import compact from '../../helpers/compact.js'
import expandStiClasses from '../../helpers/sti/expandStiClasses.js'
import { ViewModel, ViewModelClass } from '../../types/dream.js'
import {
  DreamModelSerializerType,
  SerializerType,
  SimpleObjectSerializerType,
} from '../../types/serializer.js'
import isDreamSerializer from './isDreamSerializer.js'

export const DEFAULT_SERIALIZER_KEY = 'default'

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
  if (!isDreamSerializer(serializer))
    throw new NonDreamSerializerDerivedFromGlobalSerializerForSpecifiedKey(
      obj,
      serializerKey,
      globalName,
      serializer
    )

  return serializer as ReturnType
}

export function inferSerializersFromDreamClassOrViewModelClass(
  classDef: typeof Dream | ViewModelClass | null | undefined,
  serializerKey: string | undefined = undefined
): (DreamModelSerializerType | SimpleObjectSerializerType)[] {
  if (!classDef) return []
  const classes = expandStiClasses(classDef)

  const serializers = classes.map(classDef =>
    inferSerializerFromDreamOrViewModel(classDef.prototype, serializerKey)
  )

  return compact(serializers)
}
