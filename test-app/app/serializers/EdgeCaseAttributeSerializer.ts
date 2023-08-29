import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'
import EdgeCaseAttribute from '../models/EdgeCaseAttribute'

export default class EdgeCaseAttributeSerializer<
  DataType extends EdgeCaseAttribute
> extends DreamSerializer<DataType> {
  @Attribute()
  public kPop: any

  @Attribute()
  public popK: string

  @Attribute()
  public popKPop: number
}
