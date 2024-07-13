import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import SoftDelete from '../../../src/decorators/soft-delete'
import { DreamColumn } from '../../../src/dream/types'
import PostSerializer from '../serializers/PostSerializer'
import ApplicationModel from './ApplicationModel'
import HeartRating from './ExtraRating/HeartRating'
import PostComment from './PostComment'
import PostVisibility from './PostVisibility'
import Rating from './Rating'
import User from './User'

@SoftDelete()
export default class Post extends ApplicationModel {
  public get table() {
    return 'posts' as const
  }

  public get serializers() {
    return { default: PostSerializer<any> } as const
  }

  public id: DreamColumn<Post, 'id'>
  public createdAt: DreamColumn<Post, 'createdAt'>
  public deletedAt: DreamColumn<Post, 'deletedAt'>

  @Post.Sortable({ scope: 'user' })
  public position: DreamColumn<Post, 'position'>

  public body: DreamColumn<Post, 'body'>

  @BelongsTo(() => User)
  public user: User
  public userId: DreamColumn<Post, 'userId'>

  @BelongsTo(() => PostVisibility, { optional: true })
  public postVisibility: PostVisibility | null
  public postVisibilityId: DreamColumn<Post, 'postVisibilityId'>

  @HasMany(() => PostComment, { dependent: 'destroy' })
  public comments: PostComment[]

  @HasMany(() => PostComment, { withoutDefaultScopes: ['dream:SoftDelete'] })
  public allComments: PostComment[]

  @HasMany(() => Rating, {
    foreignKey: 'rateableId',
    polymorphic: true,
    dependent: 'destroy',
  })
  public ratings: Rating[]

  @HasMany(() => HeartRating, {
    foreignKey: 'extraRateableId',
    polymorphic: true,
    dependent: 'destroy',
  })
  public heartRatings: HeartRating[]
}
