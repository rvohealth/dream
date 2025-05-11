import Dream from '../Dream.js'
import ObjectSerializerBuilder from './builders/ObjectSerializerBuilder.js'

export default function ObjectSerializer<
  DataType extends object | null,
  PassthroughDataType extends object | undefined = undefined,
>(data: DataType extends Dream ? never : DataType, passthroughData?: PassthroughDataType) {
  return new ObjectSerializerBuilder<DataType, PassthroughDataType>(data, passthroughData)
}
