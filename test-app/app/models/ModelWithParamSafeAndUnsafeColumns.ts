import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'

// const deco = new Decorators<InstanceType<typeof ModelWithParamSafeAndUnsafeColumns>>()

export default class ModelWithParamSafeAndUnsafeColumns extends ApplicationModel {
  public get table() {
    return 'model_with_param_safe_and_unsafe_columns' as const
  }

  public get paramSafeColumns() {
    return ['allowedColumn1', 'allowedColumn2', 'disallowedColumn1', 'disallowedColumn2'] as const
  }

  public get paramUnsafeColumns() {
    return ['disallowedColumn1', 'disallowedColumn2'] as const
  }

  public id: DreamColumn<ModelWithParamSafeAndUnsafeColumns, 'id'>
  public column1: DreamColumn<ModelWithParamSafeAndUnsafeColumns, 'column1'>
  public allowedColumn1: DreamColumn<ModelWithParamSafeAndUnsafeColumns, 'allowedColumn1'>
  public disallowedColumn1: DreamColumn<ModelWithParamSafeAndUnsafeColumns, 'disallowedColumn1'>
  public column2: DreamColumn<ModelWithParamSafeAndUnsafeColumns, 'column2'>
  public allowedColumn2: DreamColumn<ModelWithParamSafeAndUnsafeColumns, 'allowedColumn2'>
  public disallowedColumn2: DreamColumn<ModelWithParamSafeAndUnsafeColumns, 'disallowedColumn2'>
  public createdAt: DreamColumn<ModelWithParamSafeAndUnsafeColumns, 'createdAt'>
  public updatedAt: DreamColumn<ModelWithParamSafeAndUnsafeColumns, 'updatedAt'>
}
