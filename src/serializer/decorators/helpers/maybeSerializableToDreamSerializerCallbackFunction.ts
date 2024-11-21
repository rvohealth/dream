import Dream from '../../../Dream'
import { DreamSerializerCallback, SerializableClassOrClasses } from '../../../dream/types'
import hasSerializersGetter from './hasSerializersGetter'

export default function (
  dreamOrSerializerClass: SerializableClassOrClasses | null
): DreamSerializerCallback | null {
  if (dreamOrSerializerClass === null) return null
  if (Array.isArray(dreamOrSerializerClass)) return null
  if ((dreamOrSerializerClass as unknown as typeof Dream).isDream) return null
  if (hasSerializersGetter(dreamOrSerializerClass)) return null

  // this must not call the function because this function is called as part of decorator
  // execution, which happens at file load time and creates circular dependencies if the
  // class is referenced directly during file load
  if (dreamOrSerializerClass instanceof Function) return dreamOrSerializerClass as DreamSerializerCallback

  return null
}
