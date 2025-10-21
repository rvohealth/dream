import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'

const deco = new Decorators<typeof ModelWithoutUpdatedAt>()

export default class ModelWithoutUpdatedAt extends ApplicationModel {
  public override get table() {
    return 'model_without_updated_at' as const
  }

  public id: DreamColumn<ModelWithoutUpdatedAt, 'id'>
  public name: DreamColumn<ModelWithoutUpdatedAt, 'name'>
  public cantUpdateThis: DreamColumn<ModelWithoutUpdatedAt, 'cantUpdateThis'>
  public createdAt: DreamColumn<ModelWithoutUpdatedAt, 'createdAt'>

  @deco.BeforeUpdate()
  public clearCantUpdateThis() {
    ;(this as any).cantUpdateThis = undefined
  }
}
