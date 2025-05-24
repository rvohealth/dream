import Dream from '../../Dream.js'
import {
  DreamModelSerializerType,
  SimpleModelSerializerType,
  ViewModelSerializerType,
} from '../../types/serializer.js'
import DreamSerializer from '../DreamSerializer.js'
import SimpleObjectSerializer from '../SimpleObjectSerializer.js'
import ViewModelSerializer from '../ViewModelSerializer.js'

export default function isDreamSerializer(dreamOrSerializerClass: any) {
  const asDream = dreamOrSerializerClass as Dream
  if (asDream.isDreamInstance) return false

  const asSerializer = dreamOrSerializerClass as
    | DreamModelSerializerType
    | ViewModelSerializerType
    | SimpleModelSerializerType

  if (typeof asSerializer !== 'function') return false

  try {
    const serializer = asSerializer(undefined as any, undefined as any)
    return (
      serializer instanceof DreamSerializer ||
      serializer instanceof ViewModelSerializer ||
      serializer instanceof SimpleObjectSerializer
    )
  } catch {
    return false
  }
}
