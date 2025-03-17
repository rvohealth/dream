import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import { DreamColumn, Scope } from '../../../src/index.js'
import ApplicationModel from './ApplicationModel.js'

// const Deco = new Decorators<InstanceType<typeof ModelWithoutDeletedAt>>()

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

  // Used for testing the rendering of default scopes within SchemaBuilder.spec
  @Scope({ default: true })
  public static howyadoin() {}
}
