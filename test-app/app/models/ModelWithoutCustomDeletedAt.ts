import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import { DreamColumn } from '../../../src/index.js'
import ApplicationModel from './ApplicationModel.js'

// const deco = new Decorators<typeof ModelWithoutCustomDeletedAt>()

// NOTE: this model only exists for the sake of testing
// what happens when @SoftDelete is applied to a model
// which has a deletedAtField override which points
// to a column that is not a datetime field
@SoftDelete()
export default class ModelWithoutCustomDeletedAt extends ApplicationModel {
  public override get table() {
    return 'model_without_custom_deleted_ats' as const
  }

  public override get deletedAtField() {
    return 'id' as const
  }

  public override get createdAtField() {
    return 'updatedAt' as const
  }

  public override get updatedAtField() {
    return 'createdAt' as const
  }

  public id: DreamColumn<ModelWithoutCustomDeletedAt, 'id'>
  public deletedAt: DreamColumn<ModelWithoutCustomDeletedAt, 'deletedAt'>
  public createdAt: DreamColumn<ModelWithoutCustomDeletedAt, 'createdAt'>
  public updatedAt: DreamColumn<ModelWithoutCustomDeletedAt, 'updatedAt'>
}
