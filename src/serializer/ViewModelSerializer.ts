import Dream from '../Dream.js'
import { ViewModel, ViewModelClass } from '../types/dream.js'
import ViewModelSerializerBuilder from './builders/ViewModelSerializerBuilder.js'

export default function ViewModelSerializer<
  VMClass extends ViewModelClass,
  DataType extends ViewModel | null,
  PassthroughDataType extends object | undefined = undefined,
>(
  viewModelClass: VMClass,
  data: DataType extends Dream ? never : DataType,
  passthroughData?: PassthroughDataType
) {
  return new ViewModelSerializerBuilder<VMClass, DataType, PassthroughDataType>(
    viewModelClass,
    data,
    passthroughData
  )
}
