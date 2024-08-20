import DreamSerializer from '../..'
import Dream from '../../../dream'
import { DreamSerializerCallback, SerializableClassOrClasses } from '../../../dream/types'
import hasSerializersGetter from './hasSerializersGetter'

export default function (
  dreamOrSerializerClass: SerializableClassOrClasses | null
): typeof DreamSerializer | null {
  if (dreamOrSerializerClass === null) return null
  if (Array.isArray(dreamOrSerializerClass)) return null
  if ((dreamOrSerializerClass as unknown as typeof Dream).isDream) return null
  if (hasSerializersGetter(dreamOrSerializerClass)) return null
  if (
    dreamOrSerializerClass instanceof Function &&
    (dreamOrSerializerClass as DreamSerializerCallback)()?.isDreamSerializer
  )
    return (dreamOrSerializerClass as DreamSerializerCallback)()
  return null
}
