import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import { IdType } from '../../../src/dream/types'
import PostVisibility from './PostVisibility'
import Rating from './Rating'
import User from './User'
import HeartRating from './ExtraRating/HeartRating'
import ApplicationModel from './ApplicationModel'

export default class Post extends ApplicationModel {
  public get table() {
    return 'posts' as const
  }

  public id: IdType
  public body: string | null

  @BelongsTo(() => User)
  public user: User
  public userId: IdType

  @BelongsTo(() => PostVisibility, { optional: true })
  public postVisibility: PostVisibility | null
  public postVisibilityId: IdType | null

  @HasMany(() => Rating, {
    foreignKey: 'rateableId',
    polymorphic: true,
  })
  public ratings: Rating[]

  @HasMany(() => HeartRating, {
    foreignKey: 'extraRateableId',
    polymorphic: true,
  })
  public heartRatings: HeartRating[]
}
