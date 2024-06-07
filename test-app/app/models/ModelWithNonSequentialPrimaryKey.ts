import { DreamColumn } from '../../../src'
import ApplicationModel from './ApplicationModel'
import ModelWithNonSequentialPrimaryKeySerializer, {
  ModelWithNonSequentialPrimaryKeySummarySerializer,
} from '../serializers/ModelWithNonSequentialPrimaryKeySerializer'

export default class ModelWithNonSequentialPrimaryKey extends ApplicationModel {
  public get table() {
    return 'model_with_non_sequential_primary_keys' as const
  }

  public get serializers() {
    return {
      default: ModelWithNonSequentialPrimaryKeySerializer<any, any>,
      summary: ModelWithNonSequentialPrimaryKeySummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<ModelWithNonSequentialPrimaryKey, 'id'>
  public createdAt: DreamColumn<ModelWithNonSequentialPrimaryKey, 'createdAt'>
  public updatedAt: DreamColumn<ModelWithNonSequentialPrimaryKey, 'updatedAt'>
}
