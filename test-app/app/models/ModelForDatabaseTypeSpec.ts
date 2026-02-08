import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'

// const deco = new Decorators<typeof ModelForDatabaseTypeSpec>()

export default class ModelForDatabaseTypeSpec extends ApplicationModel {
  public override get table() {
    return 'model_for_database_type_specs' as const
  }

  public id: DreamColumn<ModelForDatabaseTypeSpec, 'id'>
  public myDatetime: DreamColumn<ModelForDatabaseTypeSpec, 'myDatetime'>
  public createdAt: DreamColumn<ModelForDatabaseTypeSpec, 'createdAt'>
  public updatedAt: DreamColumn<ModelForDatabaseTypeSpec, 'updatedAt'>
}
