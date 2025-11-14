import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'

const deco = new Decorators<typeof ModelWithoutDeletedAt>()

// NOTE: this model only exists for the sake of testing
// what happens when @SoftDelete is applied to a model
// which does not have a `deletedAt` field
@SoftDelete()
export default class ModelWithoutDeletedAt extends ApplicationModel {
  public override get table() {
    return 'model_without_deleted_ats' as const
  }

  public id: DreamColumn<ModelWithoutDeletedAt, 'id'>
  public createdAt: DreamColumn<ModelWithoutDeletedAt, 'createdAt'>
  public updatedAt: DreamColumn<ModelWithoutDeletedAt, 'updatedAt'>

  // Used for testing the rendering of default scopes within SchemaBuilder.spec
  @deco.Scope({ default: true })
  public static howyadoin() {}
}
