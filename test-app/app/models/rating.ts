import BelongsTo from '../../../src/decorators/associations/belongs-to'
import Dream from '../../../src/dream'
import Composition from './composition'
import Post from './post'
import User from './user'

export default class Rating extends Dream {
  public get table() {
    return 'ratings' as const
  }

  public id: number
  public body: string | null

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
