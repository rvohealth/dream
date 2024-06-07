import { DreamColumn } from '../../../src'
import ApplicationModel from './ApplicationModel'
import ModelWithoutCreatedAtButWithFallbackSerializer, {
  ModelWithoutCreatedAtButWithFallbackSummarySerializer,
} from '../../../test-app/app/serializers/ModelWithoutCreatedAtButWithFallbackSerializer'

export default class ModelWithoutCreatedAtButWithFallback extends ApplicationModel {
  public get table() {
    return 'model_without_created_at_but_with_fallbacks' as const
  }

  public get serializers() {
    return {
      default: ModelWithoutCreatedAtButWithFallbackSerializer<any, any>,
      summary: ModelWithoutCreatedAtButWithFallbackSummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<ModelWithoutCreatedAtButWithFallback, 'id'>
  public datetime: DreamColumn<ModelWithoutCreatedAtButWithFallback, 'datetime'>
  public updatedAt: DreamColumn<ModelWithoutCreatedAtButWithFallback, 'updatedAt'>

  public get defaultOrderableColumn() {
    return 'datetime' as const
  }
}
