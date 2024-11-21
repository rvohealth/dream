import BeforeUpdate from '../../../src/decorators/hooks/BeforeUpdate'
import { DreamColumn } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'

export default class ModelWithoutUpdatedAt extends ApplicationModel {
  public get table() {
    return 'model_without_updated_at' as const
  }

  public id: DreamColumn<ModelWithoutUpdatedAt, 'id'>
  public name: DreamColumn<ModelWithoutUpdatedAt, 'name'>
  public cantUpdateThis: DreamColumn<ModelWithoutUpdatedAt, 'cantUpdateThis'>
  public createdAt: DreamColumn<ModelWithoutUpdatedAt, 'createdAt'>

  @BeforeUpdate()
  public clearCantUpdateThis() {
    ;(this as any).cantUpdateThis = undefined
  }
}
