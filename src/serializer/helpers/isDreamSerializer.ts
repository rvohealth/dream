import {
  DreamModelSerializerType,
  SimpleModelSerializerType,
  ViewModelSerializerType,
} from '../../types/serializer.js'
import DreamSerializerBuilder from '../builders/DreamSerializerBuilder.js'
import SimpleObjectSerializerBuilder from '../builders/SimpleObjectSerializerBuilder.js'
import ViewModelSerializerBuilder from '../builders/ViewModelSerializerBuilder.js'

export default function isDreamSerializer(dreamOrSerializerClass: any) {
  const asSerializer = dreamOrSerializerClass as
    | DreamModelSerializerType
    | ViewModelSerializerType
    | SimpleModelSerializerType
  return (
    typeof asSerializer === 'function' &&
    (asSerializer instanceof DreamSerializerBuilder ||
      asSerializer instanceof ViewModelSerializerBuilder ||
      asSerializer instanceof SimpleObjectSerializerBuilder)
  )
}
