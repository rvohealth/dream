import SoftDelete from '../../../src/decorators/SoftDelete.js'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types.js'
import { Decorators } from '../../../src/index.js'
import ApplicationModel from './ApplicationModel.js'
import HeartRating from './ExtraRating/HeartRating.js'
import NonNullRating from './NonNullRating.js'
import PostComment from './PostComment.js'
import PostVisibility from './PostVisibility.js'
import Rating from './Rating.js'
import User from './User.js'

const Deco = new Decorators<InstanceType<typeof Post>>()

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

  @Deco.Sortable({ scope: 'user' })
  public position: DreamColumn<Post, 'position'>

  public body: DreamColumn<Post, 'body'>

  @Deco.BelongsTo('User')
  public user: User
  public userId: DreamColumn<Post, 'userId'>

  @Deco.BelongsTo('PostVisibility', { optional: true })
  public postVisibility: PostVisibility | null
  public postVisibilityId: DreamColumn<Post, 'postVisibilityId'>

  @Deco.HasMany('PostComment', { dependent: 'destroy' })
  public comments: PostComment[]

  @Deco.HasMany('PostComment', { withoutDefaultScopes: ['dream:SoftDelete'] })
  public allComments: PostComment[]

  @Deco.HasMany('Rating', {
    foreignKey: 'rateableId',
    polymorphic: true,
    dependent: 'destroy',
  })
  public ratings: Rating[]

  @Deco.HasMany('PostComment', { on: { body: undefined } })
  public invalidWherePostComments: PostComment[]

  @Deco.HasMany('PostComment', { notOn: { body: undefined } })
  public invalidWhereNotPostComments: PostComment[]

  // Traveling through NonNullRating, a model
  // which uses a default scope to automatically
  // exclude any Rating with a null body.
  // by passing withoutDefaultScopes, we
  // override the default scope, allowing us
  // to see null bodies
  @Deco.HasMany('NonNullRating', {
    foreignKey: 'rateableId',
    polymorphic: true,
    dependent: 'destroy',
    withoutDefaultScopes: ['nonNullBodies'],
  })
  public overriddenNonNullRatings: NonNullRating[]

  @Deco.HasMany('ExtraRating/HeartRating', {
    foreignKey: 'extraRateableId',
    polymorphic: true,
    dependent: 'destroy',
  })
  public heartRatings: HeartRating[]
}
