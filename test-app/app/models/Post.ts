import { Decorators } from '../../../src'
import SoftDelete from '../../../src/decorators/SoftDelete'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import HeartRating from './ExtraRating/HeartRating'
import NonNullRating from './NonNullRating'
import PostComment from './PostComment'
import PostVisibility from './PostVisibility'
import Rating from './Rating'
import User from './User'

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
