import { DateTime } from 'luxon'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import Scope from '../../../src/decorators/scope'
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

  @Scope({ default: true })
  public static hideDeleted(query: any) {
    return query.where({ deleted_at: null })
  }

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
