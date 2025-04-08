import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'

// const deco = new Decorators<typeof ModelWithSerialPrimaryKey>()

export default class ModelWithSerialPrimaryKey extends ApplicationModel {
  public override get table() {
    return 'model_with_serial_primary_keys' as const
  }

  public id: DreamColumn<ModelWithSerialPrimaryKey, 'id'>
  public createdAt: DreamColumn<ModelWithSerialPrimaryKey, 'createdAt'>
  public updatedAt: DreamColumn<ModelWithSerialPrimaryKey, 'updatedAt'>
}
