import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/dream/types'
import PostVisibility from './PostVisibility'
import Rating from './Rating'
import User from './User'
import StarRating from './ExtraRating/StarRating'
import HeartRating from './ExtraRating/HeartRating'

export default class Post extends Dream {
  public get table() {
    return 'posts' as const
  }

  public id: IdType
  public body: string | null

  @BelongsTo(() => User)
  public user: User
  public user_id: IdType

  @BelongsTo(() => PostVisibility, { optional: true })
  public postVisibility: PostVisibility | null
  public post_visibility_id: IdType | null

  @HasMany(() => Rating, {
    foreignKey: 'rateable_id',
    polymorphic: true,
  })
  public ratings: Rating[]

  @HasMany(() => HeartRating, {
    foreignKey: 'extra_rateable_id',
    polymorphic: true,
  })
  public heartRatings: HeartRating[]
}
