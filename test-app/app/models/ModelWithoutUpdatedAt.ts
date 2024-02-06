import { DateTime } from 'luxon'
import { IdType } from '../../../src/dream/types'
import BeforeUpdate from '../../../src/decorators/hooks/before-update'
import ApplicationModel from './ApplicationModel'

export default class ModelWithoutUpdatedAt extends ApplicationModel {
  public get table() {
    return 'model_without_updated_at' as const
  }

  public id: IdType
  public name: string
  public cantUpdateThis: string | undefined
  public createdAt: DateTime

  @BeforeUpdate()
  public async clearCantUpdateThis() {
    this.cantUpdateThis = undefined
  }
}
