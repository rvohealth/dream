import BelongsTo from '../../../src/decorators/associations/belongs-to'
import Dream from '../../../src/dream'
import Composition from './Composition'
import Post from './Post'
import User from './User'

export default class Rating extends Dream {
  public get table() {
    return 'ratings' as const
  }

  public id: number
  public body: string | null
  public rating: number | null

  @BelongsTo(() => User)
  public user: User
  public user_id: number

  @BelongsTo(() => [Composition, Post], {
    foreignKey: 'rateable_id',
    polymorphic: true,
  })
  public rateable: Composition | Post
  public rateable_id: number
  public rateable_type: string
}
