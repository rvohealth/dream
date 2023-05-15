import { DateTime } from 'luxon'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import User from './User'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/db/reflections'
import { BeforeDestroy } from '../../../src'

export default class Pet extends Dream {
  public get table() {
    return 'pets' as const
  }

  public id: IdType
  public species: string
  public name: string
  public deleted_at: DateTime
  public created_at: DateTime

  @BelongsTo(() => User, {
    optional: true,
  })
  public user: User | null
  public user_id: IdType

  @BeforeDestroy()
  public async doSoftDelete() {
    await (this as Pet).update({ deleted_at: DateTime.now() })
    this.preventDeletion()
  }
}
