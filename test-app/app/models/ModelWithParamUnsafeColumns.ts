import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'

// const Deco = new Decorators<InstanceType<typeof ModelWithParamUnsafeColumns>>()

export default class ModelWithParamUnsafeColumns extends ApplicationModel {
  public get table() {
    return 'model_with_param_unsafe_columns' as const
  }

  public get paramUnsafeColumns() {
    return ['disallowedColumn1', 'disallowedColumn2'] as const
  }

  public id: DreamColumn<ModelWithParamUnsafeColumns, 'id'>
  public allowedColumn1: DreamColumn<ModelWithParamUnsafeColumns, 'allowedColumn1'>
  public disallowedColumn1: DreamColumn<ModelWithParamUnsafeColumns, 'disallowedColumn1'>
  public allowedColumn2: DreamColumn<ModelWithParamUnsafeColumns, 'allowedColumn2'>
  public disallowedColumn2: DreamColumn<ModelWithParamUnsafeColumns, 'disallowedColumn2'>
  public createdAt: DreamColumn<ModelWithParamUnsafeColumns, 'createdAt'>
  public updatedAt: DreamColumn<ModelWithParamUnsafeColumns, 'updatedAt'>
}
