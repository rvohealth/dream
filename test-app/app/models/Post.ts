import SoftDelete from '../../../src/decorators/soft-delete'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import HeartRating from './ExtraRating/HeartRating'
import NonNullRating from './NonNullRating'
import PostComment from './PostComment'
import PostVisibility from './PostVisibility'
import Rating from './Rating'
import User from './User'

@SoftDelete()
export default class Post extends ApplicationModel {
  public get table() {
    return 'posts' as const
  }

  public get serializers(): DreamSerializers<Post> {
    return { default: 'PostSerializer' }
  }

  public id: DreamColumn<Post, 'id'>
  public createdAt: DreamColumn<Post, 'createdAt'>
  public deletedAt: DreamColumn<Post, 'deletedAt'>

  @Post.Sortable({ scope: 'user' })
  public position: DreamColumn<Post, 'position'>

  public body: DreamColumn<Post, 'body'>

  @Post.BelongsTo('User')
  public user: User
  public userId: DreamColumn<Post, 'userId'>

  @Post.BelongsTo('PostVisibility', { optional: true })
  public postVisibility: PostVisibility | null
  public postVisibilityId: DreamColumn<Post, 'postVisibilityId'>

  @Post.HasMany('PostComment', { dependent: 'destroy' })
  public comments: PostComment[]

  @Post.HasMany('PostComment', { withoutDefaultScopes: ['dream:SoftDelete'] })
  public allComments: PostComment[]

  @Post.HasMany('Rating', {
    foreignKey: 'rateableId',
    polymorphic: true,
    dependent: 'destroy',
  })
  public ratings: Rating[]

  // Traveling through NonNullRating, a model
  // which uses a default scope to automatically
  // exclude any Rating with a null body.
  // by passing withoutDefaultScopes, we
  // override the default scope, allowing us
  // to see null bodies
  @Post.HasMany('NonNullRating', {
    foreignKey: 'rateableId',
    polymorphic: true,
    dependent: 'destroy',
    withoutDefaultScopes: ['nonNullBodies'],
  })
  public overriddenNonNullRatings: NonNullRating[]

  @Post.HasMany('ExtraRating/HeartRating', {
    foreignKey: 'extraRateableId',
    polymorphic: true,
    dependent: 'destroy',
  })
  public heartRatings: HeartRating[]
}
