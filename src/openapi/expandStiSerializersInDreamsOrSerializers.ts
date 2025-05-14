import Dream from '../Dream.js'
import { DreamOrViewModel, ViewModelClass } from '../types/dream.js'
import expandStiDreamClassesOpenapi from './expandStiDreamClassesOpenapi.js'

export default function expandStiSerializersInDreamsOrSerializers(
  dreamsOrSerializers: DreamOrViewModel | DreamOrViewModel[]
): DreamOrViewModel[] {
  if (Array.isArray(dreamsOrSerializers))
    return dreamsOrSerializers.flatMap(dreamOrSerializer =>
      expandStiSerializersInDreamsOrSerializers(dreamOrSerializer)
    )

  if ((dreamsOrSerializers as typeof Dream).prototype instanceof Dream)
    return expandStiDreamClassesOpenapi(dreamsOrSerializers as typeof Dream)

  return [dreamsOrSerializers as ViewModelClass]
}
