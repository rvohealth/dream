import { DateTime } from 'luxon'
import dream from '../../../src/dream'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import User from './user'
import Dream from '../../../src/dream'

export default class Pet extends Dream {
  public get table() {
    return 'pets' as const
  }

  public id: number
  public species: string
  public name: string
  public created_at: DateTime

  @BelongsTo(() => User)
  public user: User
  public user_id: number
}
