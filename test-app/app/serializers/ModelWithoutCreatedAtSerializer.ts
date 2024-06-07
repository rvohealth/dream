import { DreamSerializer, Attribute, DreamColumn } from '../../../src'
import ModelWithoutCreatedAt from '../models/ModelWithoutCreatedAt'

export class ModelWithoutCreatedAtSummarySerializer<
  DataType extends ModelWithoutCreatedAt,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<ModelWithoutCreatedAt, 'id'>
}

export default class ModelWithoutCreatedAtSerializer<
  DataType extends ModelWithoutCreatedAt,
  Passthrough extends object,
> extends ModelWithoutCreatedAtSummarySerializer<DataType, Passthrough> {}
