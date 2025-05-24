import {
  DreamModelSerializerType,
  SimpleModelSerializerType,
  ViewModelSerializerType,
} from '../../types/serializer.js'
import DreamSerializer from '../DreamSerializer.js'
import SimpleObjectSerializer from '../SimpleObjectSerializer.js'
import ViewModelSerializer from '../ViewModelSerializer.js'

export default function isDreamSerializer(dreamOrSerializerClass: any) {
  const asSerializer = dreamOrSerializerClass as
    | DreamModelSerializerType
    | ViewModelSerializerType
    | SimpleModelSerializerType

  if (typeof asSerializer !== 'function') return false

  const serializer = asSerializer(undefined as any, undefined as any)

  return (
    serializer instanceof DreamSerializer ||
    serializer instanceof ViewModelSerializer ||
    serializer instanceof SimpleObjectSerializer
  )
}
