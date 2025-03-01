import { Decorators } from '../../../src'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Composition from './Composition'
import Post from './Post'
import User from './User'

const Decorator = new Decorators<Rating>()

export default class Rating extends ApplicationModel {
  public get table() {
    return 'ratings' as const
  }

  public get serializers(): DreamSerializers<Rating> {
    return { default: 'RatingSerializer' }
  }

  public id: DreamColumn<Rating, 'id'>
  public body: DreamColumn<Rating, 'body'>
  public rating: DreamColumn<Rating, 'rating'>

  @Decorator.BelongsTo('User')
  public user: User
  public userId: DreamColumn<Rating, 'userId'>

  @Decorator.BelongsTo(['Composition', 'Post'], {
    foreignKey: 'rateableId',
    polymorphic: true,
  })
  public rateable: Composition | Post
  public rateableId: DreamColumn<Rating, 'rateableId'>
  public rateableType: DreamColumn<Rating, 'rateableType'>

  @Decorator.BelongsTo(['Post', 'Composition'], {
    foreignKey: 'rateableId',
    polymorphic: true,
    withoutDefaultScopes: ['dream:SoftDelete'],
  })
  public rateableEvenIfDeleted: Composition | Post
}
