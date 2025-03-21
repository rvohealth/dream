import { DreamColumn } from '../../../src/dream/types.js'
import ApplicationModel from './ApplicationModel.js'

// const Deco = new Decorators<InstanceType<typeof ModelWithSerialPrimaryKey>>()

export default class ModelWithSerialPrimaryKey extends ApplicationModel {
  public get table() {
    return 'model_with_serial_primary_keys' as const
  }

  public id: DreamColumn<ModelWithSerialPrimaryKey, 'id'>
  public createdAt: DreamColumn<ModelWithSerialPrimaryKey, 'createdAt'>
  public updatedAt: DreamColumn<ModelWithSerialPrimaryKey, 'updatedAt'>
}
