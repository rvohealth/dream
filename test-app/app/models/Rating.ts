import BelongsTo from '../../../src/decorators/associations/belongs-to'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/db/reflections'
import Composition from './Composition'
import Post from './Post'
import User from './User'

export default class Rating extends Dream {
  public get table() {
    return 'ratings' as const
  }

  public id: IdType
  public body: string | null
  public rating: number | null

  @BelongsTo(() => User)
  public user: User
  public user_id: IdType

  @BelongsTo(() => [Composition, Post], {
    foreignKey: 'rateable_id',
    polymorphic: true,
  })
  public rateable: Composition | Post
  public rateable_id: IdType
  public rateable_type: string
}
