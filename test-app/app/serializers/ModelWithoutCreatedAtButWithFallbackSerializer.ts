import { DreamSerializer, Attribute, DreamColumn } from '../../../src'
import ModelWithoutCreatedAtButWithFallback from '../models/ModelWithoutCreatedAtButWithFallback'

export class ModelWithoutCreatedAtButWithFallbackSummarySerializer<
  DataType extends ModelWithoutCreatedAtButWithFallback,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<ModelWithoutCreatedAtButWithFallback, 'id'>
}

export default class ModelWithoutCreatedAtButWithFallbackSerializer<
  DataType extends ModelWithoutCreatedAtButWithFallback,
  Passthrough extends object,
> extends ModelWithoutCreatedAtButWithFallbackSummarySerializer<DataType, Passthrough> {}
