import { DreamColumn } from '../../../src'
import ApplicationModel from './ApplicationModel'
import ModelWithoutCreatedAtSerializer, {
  ModelWithoutCreatedAtSummarySerializer,
} from '../../../test-app/app/serializers/ModelWithoutCreatedAtSerializer'

export default class ModelWithoutCreatedAt extends ApplicationModel {
  public get table() {
    return 'model_without_created_ats' as const
  }

  public get serializers() {
    return {
      default: ModelWithoutCreatedAtSerializer<any, any>,
      summary: ModelWithoutCreatedAtSummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<ModelWithoutCreatedAt, 'id'>
  public updatedAt: DreamColumn<ModelWithoutCreatedAt, 'updatedAt'>
}
