import DreamSerializer from '../../../src/serializer.js'
import Attribute from '../../../src/serializer/decorators/attribute.js'
import EdgeCaseAttribute from '../models/EdgeCaseAttribute.js'

export default class EdgeCaseAttributeSerializer<
  DataType extends EdgeCaseAttribute,
> extends DreamSerializer<DataType> {
  @Attribute('boolean')
  public kPop: any

  @Attribute('string')
  public popK: string

  @Attribute('number')
  public popKPop: number

  @Attribute('decimal', { precision: 2 })
  public roundedPopKPop: number
}
