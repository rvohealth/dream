import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import { Decorators } from '../../../src/index.js'
import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import HeartRating from './ExtraRating/HeartRating.js'
import NonNullRating from './NonNullRating.js'
import PostComment from './PostComment.js'
import PostVisibility from './PostVisibility.js'
import Rating from './Rating.js'
import User from './User.js'

const deco = new Decorators<typeof Post>()

@SoftDelete()
export default class Post extends ApplicationModel {
  public override get table() {
    return 'posts' as const
  }

  public get serializers(): DreamSerializers<Post> {
    return { default: 'PostSerializer' }
  }

  public id: DreamColumn<Post, 'id'>
  public createdAt: DreamColumn<Post, 'createdAt'>
  public deletedAt: DreamColumn<Post, 'deletedAt'>

  @deco.Sortable({ scope: 'user' })
  public position: DreamColumn<Post, 'position'>

  public body: DreamColumn<Post, 'body'>

  @deco.BelongsTo('User')
  public user: User
  public userId: DreamColumn<Post, 'userId'>

  @deco.BelongsTo('PostVisibility', { optional: true })
  public postVisibility: PostVisibility | null
  public postVisibilityId: DreamColumn<Post, 'postVisibilityId'>

  @deco.HasMany('PostComment', { dependent: 'destroy' })
  public comments: PostComment[]

  @deco.HasMany('PostComment', { withoutDefaultScopes: ['dream:SoftDelete'] })
  public allComments: PostComment[]

  @deco.HasMany('Rating', {
    foreignKey: 'rateableId',
    polymorphic: true,
    dependent: 'destroy',
  })
  public ratings: Rating[]

  @deco.HasMany('PostComment', { on: { body: undefined as unknown as string } })
  public invalidWherePostComments: PostComment[]

  @deco.HasMany('PostComment', { notOn: { body: undefined as unknown as string } })
  public invalidWhereNotPostComments: PostComment[]

  // Traveling through NonNullRating, a model
  // which uses a default scope to automatically
  // exclude any Rating with a null body.
  // by passing withoutDefaultScopes, we
  // override the default scope, allowing us
  // to see null bodies
  @deco.HasMany('NonNullRating', {
    foreignKey: 'rateableId',
    polymorphic: true,
    dependent: 'destroy',
    withoutDefaultScopes: ['nonNullBodies'],
  })
  public overriddenNonNullRatings: NonNullRating[]

  @deco.HasMany('ExtraRating/HeartRating', {
    foreignKey: 'extraRateableId',
    polymorphic: true,
    dependent: 'destroy',
  })
  public heartRatings: HeartRating[]
}
