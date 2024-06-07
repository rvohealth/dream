import { DreamSerializer, Attribute, DreamColumn } from '../../../src'
import ModelWithNonSequentialPrimaryKey from '../models/ModelWithNonSequentialPrimaryKey'

export class ModelWithNonSequentialPrimaryKeySummarySerializer<
  DataType extends ModelWithNonSequentialPrimaryKey,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<ModelWithNonSequentialPrimaryKey, 'id'>
}

export default class ModelWithNonSequentialPrimaryKeySerializer<
  DataType extends ModelWithNonSequentialPrimaryKey,
  Passthrough extends object,
> extends ModelWithNonSequentialPrimaryKeySummarySerializer<DataType, Passthrough> {}
