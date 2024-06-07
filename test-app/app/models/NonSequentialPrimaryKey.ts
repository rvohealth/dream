import { DreamColumn } from '../../../src'
import ApplicationModel from './ApplicationModel'
import NonSequentialPrimaryKeySerializer, {
  NonSequentialPrimaryKeySummarySerializer,
} from '../../../test-app/app/serializers/NonSequentialPrimaryKeySerializer'

export default class NonSequentialPrimaryKey extends ApplicationModel {
  public get table() {
    return 'non_sequential_primary_keys' as const
  }

  public get serializers() {
    return {
      default: NonSequentialPrimaryKeySerializer<any, any>,
      summary: NonSequentialPrimaryKeySummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<NonSequentialPrimaryKey, 'id'>
  public updatedAt: DreamColumn<NonSequentialPrimaryKey, 'updatedAt'>
}
