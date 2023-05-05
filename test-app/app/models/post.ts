import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import Dream from '../../../src/dream'
import PostVisibility from './PostVisibility'
import Rating from './Rating'
import User from './User'

export default class Post extends Dream {
  public get table() {
    return 'posts' as const
  }

  public id: number
  public body: string | null

  @BelongsTo(() => User)
  public user: User
  public user_id: number

  @BelongsTo(() => PostVisibility, { optional: true })
  public postVisibility: PostVisibility | null
  public post_visibility_id: number | null

  @HasMany(() => Rating, {
    foreignKey: 'rateable_id',
    polymorphic: true,
  })
  public ratings: Rating[]
}
