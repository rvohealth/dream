import { Decorators, DreamColumn } from '../../../src'
import SoftDelete from '../../../src/decorators/SoftDelete'
import { Type } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'

const Decorator = new Decorators<Type<typeof ModelWithoutCustomDeletedAt>>()

// NOTE: this model only exists for the sake of testing
// what happens when @SoftDelete is applied to a model
// which has a deletedAtField override which points
// to a column that is not a datetime field
@SoftDelete()
export default class ModelWithoutCustomDeletedAt extends ApplicationModel {
  public get table() {
    return 'model_without_custom_deleted_ats' as const
  }

  public get deletedAtField() {
    return 'id' as const
  }

  public get createdAtField() {
    return 'updatedAt' as const
  }

  public get updatedAtField() {
    return 'createdAt' as const
  }

  public id: DreamColumn<ModelWithoutCustomDeletedAt, 'id'>
  public deletedAt: DreamColumn<ModelWithoutCustomDeletedAt, 'deletedAt'>
  public createdAt: DreamColumn<ModelWithoutCustomDeletedAt, 'createdAt'>
  public updatedAt: DreamColumn<ModelWithoutCustomDeletedAt, 'updatedAt'>
}
