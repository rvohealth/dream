import { Decorators } from '../../../src/index.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'

const Deco = new Decorators<InstanceType<typeof ModelWithoutUpdatedAt>>()

export default class ModelWithoutUpdatedAt extends ApplicationModel {
  public get table() {
    return 'model_without_updated_at' as const
  }

  public id: DreamColumn<ModelWithoutUpdatedAt, 'id'>
  public name: DreamColumn<ModelWithoutUpdatedAt, 'name'>
  public cantUpdateThis: DreamColumn<ModelWithoutUpdatedAt, 'cantUpdateThis'>
  public createdAt: DreamColumn<ModelWithoutUpdatedAt, 'createdAt'>

  @Deco.BeforeUpdate()
  public clearCantUpdateThis() {
    ;(this as any).cantUpdateThis = undefined
  }
}
