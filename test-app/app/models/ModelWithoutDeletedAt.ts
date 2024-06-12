import { DreamColumn } from '../../../src'
import SoftDelete from '../../../src/decorators/soft-delete'
import ApplicationModel from './ApplicationModel'

// NOTE: this model only exists for the sake of testing
// what happens when @SoftDelete is applied to a model
// which does not have a `deletedAt` field
@SoftDelete()
export default class ModelWithoutDeletedAt extends ApplicationModel {
  public get table() {
    return 'model_without_deleted_ats' as const
  }

  public id: DreamColumn<ModelWithoutDeletedAt, 'id'>
  public createdAt: DreamColumn<ModelWithoutDeletedAt, 'createdAt'>
  public updatedAt: DreamColumn<ModelWithoutDeletedAt, 'updatedAt'>
}
