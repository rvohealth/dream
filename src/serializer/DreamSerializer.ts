import Dream from '../Dream.js'
import DreamSerializerBuilder from './builders/DreamSerializerBuilder.js'

export default function DreamSerializer<
  DreamClass extends typeof Dream,
  DataType extends Dream | null,
  PassthroughDataType extends object | undefined = undefined,
>(dreamClass: DreamClass, data: DataType, passthroughData?: PassthroughDataType) {
  return new DreamSerializerBuilder<DreamClass, DataType, PassthroughDataType>(
    dreamClass,
    data,
    passthroughData
  )
}
