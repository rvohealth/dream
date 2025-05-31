import ObjectSerializerBuilder from './builders/ObjectSerializerBuilder.js'

export default function ObjectSerializer<
  DataType extends object | null,
  PassthroughDataType extends object | undefined = undefined,
  // don't attempt to exclude Dream with `DataType extends Dream ? never : DataType`
  // because it breaks types when adding type generics to a serializer
  // e.g.: `<T extends MyClass>(data: MyClass) =>`
>(data: DataType, passthroughData?: PassthroughDataType) {
  return new ObjectSerializerBuilder<DataType, PassthroughDataType>(data, passthroughData)
}
