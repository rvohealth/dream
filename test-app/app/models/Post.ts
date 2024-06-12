import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import Query from '../../../src/dream/query'
import Scope from '../../../src/decorators/scope'
import { DreamColumn } from '../../../src/dream/types'
import PostVisibility from './PostVisibility'
import Rating from './Rating'
import User from './User'
import HeartRating from './ExtraRating/HeartRating'
import ApplicationModel from './ApplicationModel'
import PostSerializer from '../serializers/PostSerializer'

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

  @HasMany(() => Rating, {
    foreignKey: 'rateableId',
    polymorphic: true,
    cascade: 'destroy',
  })
  public ratings: Rating[]

  @HasMany(() => HeartRating, {
    foreignKey: 'extraRateableId',
    polymorphic: true,
    cascade: 'destroy',
  })
  public heartRatings: HeartRating[]

  @Scope({ default: true })
  public static hideDeleted(query: Query<Post>) {
    return query.where({ deletedAt: null })
  }
}
