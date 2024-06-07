import { DreamColumn } from '../../../src'
import ApplicationModel from './ApplicationModel'
import ModelWithNonSequentialPrimaryKeyAndCustomCreatedAtSerializer, {
  ModelWithNonSequentialPrimaryKeyAndCustomCreatedAtSummarySerializer,
} from '../serializers/ModelWithNonSequentialPrimaryKeyAndCustomCreatedAtSerializer'

export default class ModelWithNonSequentialPrimaryKeyAndCustomCreatedAt extends ApplicationModel {
  public get table() {
    return 'model_with_non_sequential_primary_key_and_custom_created_ats' as const
  }

  public get serializers() {
    return {
      default: ModelWithNonSequentialPrimaryKeyAndCustomCreatedAtSerializer<any, any>,
      summary: ModelWithNonSequentialPrimaryKeyAndCustomCreatedAtSummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<ModelWithNonSequentialPrimaryKeyAndCustomCreatedAt, 'id'>
  public datetime: DreamColumn<ModelWithNonSequentialPrimaryKeyAndCustomCreatedAt, 'datetime'>
  public updatedAt: DreamColumn<ModelWithNonSequentialPrimaryKeyAndCustomCreatedAt, 'updatedAt'>

  public get createdAtField() {
    return 'datetime' as const
  }
}
