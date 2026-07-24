import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import User from './User.js'

const deco = new Decorators<typeof ModelWithIgnoredColumns>()

/**
 * Permanently models deploy 1 of the two-deploy column-drop process: the
 * underlying table has a deprecated_column (see the
 * create-model-with-ignored-columns migration), but this model declares it
 * ignored, so the generated types files omit it. Specs use this model to
 * pin the ignoredColumns contract: the column is invisible to the type
 * system and to `columns()`, yet still present in the live database.
 */
export default class ModelWithIgnoredColumns extends ApplicationModel {
  public override get table() {
    return 'model_with_ignored_columns' as const
  }

  public override get ignoredColumns() {
    return ['deprecatedColumn'] as const
  }

  public id: DreamColumn<ModelWithIgnoredColumns, 'id'>
  public name: DreamColumn<ModelWithIgnoredColumns, 'name'>
  public createdAt: DreamColumn<ModelWithIgnoredColumns, 'createdAt'>
  public updatedAt: DreamColumn<ModelWithIgnoredColumns, 'updatedAt'>

  @deco.BelongsTo('User', { optional: true })
  public user: User | null
  public userId: DreamColumn<ModelWithIgnoredColumns, 'userId'>
}
