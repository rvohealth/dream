import { Decorators } from '../../../src'
import SoftDelete from '../../../src/decorators/SoftDelete'
import { DreamColumn, DreamSerializers, Type } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import HeartRating from './ExtraRating/HeartRating'
import NonNullRating from './NonNullRating'
import PostComment from './PostComment'
import PostVisibility from './PostVisibility'
import Rating from './Rating'
import User from './User'

const Decorator = new Decorators<Type<typeof Post>>()

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

  @Decorator.Sortable({ scope: 'user' })
  public position: DreamColumn<Post, 'position'>

  public body: DreamColumn<Post, 'body'>

  @Decorator.BelongsTo('User')
  public user: User
  public userId: DreamColumn<Post, 'userId'>

  @Decorator.BelongsTo('PostVisibility', { optional: true })
  public postVisibility: PostVisibility | null
  public postVisibilityId: DreamColumn<Post, 'postVisibilityId'>

  @Decorator.HasMany('PostComment', { dependent: 'destroy' })
  public comments: PostComment[]

  @Decorator.HasMany('PostComment', { withoutDefaultScopes: ['dream:SoftDelete'] })
  public allComments: PostComment[]

  @Decorator.HasMany('Rating', {
    foreignKey: 'rateableId',
    polymorphic: true,
    dependent: 'destroy',
  })
  public ratings: Rating[]

  @Decorator.HasMany('PostComment', { on: { body: undefined } })
  public invalidWherePostComments: PostComment[]

  @Decorator.HasMany('PostComment', { notOn: { body: undefined } })
  public invalidWhereNotPostComments: PostComment[]

  // Traveling through NonNullRating, a model
  // which uses a default scope to automatically
  // exclude any Rating with a null body.
  // by passing withoutDefaultScopes, we
  // override the default scope, allowing us
  // to see null bodies
  @Decorator.HasMany('NonNullRating', {
    foreignKey: 'rateableId',
    polymorphic: true,
    dependent: 'destroy',
    withoutDefaultScopes: ['nonNullBodies'],
  })
  public overriddenNonNullRatings: NonNullRating[]

  @Decorator.HasMany('ExtraRating/HeartRating', {
    foreignKey: 'extraRateableId',
    polymorphic: true,
    dependent: 'destroy',
  })
  public heartRatings: HeartRating[]
}
