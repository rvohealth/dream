import { DateTime } from 'luxon'
import dream from '../../../src/dream'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import User from './user'

const Dream = dream('pets')
export default class Pet extends Dream {
  public id: number
  public species: string
  public name: string
  public created_at: DateTime

  @BelongsTo(() => User)
  public user: User
  public user_id: number
}
