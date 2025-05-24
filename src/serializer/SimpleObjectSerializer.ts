import Dream from '../Dream.js'
import SimpleObjectSerializerBuilder from './builders/SimpleObjectSerializerBuilder.js'

export default function SimpleObjectSerializer<
  DataType extends object | null,
  PassthroughDataType extends object | undefined = undefined,
>(data: DataType extends Dream ? never : DataType, passthroughData?: PassthroughDataType) {
  return new SimpleObjectSerializerBuilder<DataType, PassthroughDataType>(data, passthroughData)
}
