import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import Pet from './Pet.js'

const deco = new Decorators<typeof ModelForDatabaseTypeSpec>()

export default class ModelForDatabaseTypeSpec extends ApplicationModel {
  public override get table() {
    return 'model_for_database_type_specs' as const
  }

  public id: DreamColumn<ModelForDatabaseTypeSpec, 'id'>
  public myDatetime: DreamColumn<ModelForDatabaseTypeSpec, 'myDatetime'>
  public myDatetimeTz: DreamColumn<ModelForDatabaseTypeSpec, 'myDatetimeTz'>
  public myDate: DreamColumn<ModelForDatabaseTypeSpec, 'myDate'>
  public myTimeWithoutZone: DreamColumn<ModelForDatabaseTypeSpec, 'myTimeWithoutZone'>
  public myTimeWithZone: DreamColumn<ModelForDatabaseTypeSpec, 'myTimeWithZone'>
  public createdAt: DreamColumn<ModelForDatabaseTypeSpec, 'createdAt'>
  public updatedAt: DreamColumn<ModelForDatabaseTypeSpec, 'updatedAt'>

  @deco.BelongsTo('Pet', { optional: true })
  public pet: Pet
}
