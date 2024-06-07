import { DreamSerializer, Attribute, DreamColumn } from '../../../src'
import NonSequentialPrimaryKey from '../models/NonSequentialPrimaryKey'

export class NonSequentialPrimaryKeySummarySerializer<
  DataType extends NonSequentialPrimaryKey,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<NonSequentialPrimaryKey, 'id'>
}

export default class NonSequentialPrimaryKeySerializer<
  DataType extends NonSequentialPrimaryKey,
  Passthrough extends object,
> extends NonSequentialPrimaryKeySummarySerializer<DataType, Passthrough> {}
