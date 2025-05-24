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
  return (
    typeof asSerializer === 'function' &&
    (asSerializer instanceof DreamSerializer ||
      asSerializer instanceof ViewModelSerializer ||
      asSerializer instanceof SimpleObjectSerializer)
  )
}
