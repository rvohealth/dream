import { DateTime } from 'luxon'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import User from './User'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/db/reflections'

export default class Pet extends Dream {
  public get table() {
    return 'pets' as const
  }

  public id: IdType
  public species: string
  public name: string
  public created_at: DateTime

  @BelongsTo(() => User, {
    optional: true,
  })
  public user: User
  public user_id: IdType
}
