import { DreamSerializer, Attribute, DreamColumn } from '../../../src'
import ModelWithNonSequentialPrimaryKeyAndCustomCreatedAt from '../models/ModelWithNonSequentialPrimaryKeyAndCustomCreatedAt'

export class ModelWithNonSequentialPrimaryKeyAndCustomCreatedAtSummarySerializer<
  DataType extends ModelWithNonSequentialPrimaryKeyAndCustomCreatedAt,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<ModelWithNonSequentialPrimaryKeyAndCustomCreatedAt, 'id'>
}

export default class ModelWithNonSequentialPrimaryKeyAndCustomCreatedAtSerializer<
  DataType extends ModelWithNonSequentialPrimaryKeyAndCustomCreatedAt,
  Passthrough extends object,
> extends ModelWithNonSequentialPrimaryKeyAndCustomCreatedAtSummarySerializer<DataType, Passthrough> {}
