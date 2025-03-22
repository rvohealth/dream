import { Decorators } from '../../../src/index.js'
import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import Composition from './Composition.js'
import Post from './Post.js'
import User from './User.js'

const Deco = new Decorators<InstanceType<typeof Rating>>()

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

  @Deco.BelongsTo('User')
  public user: User
  public userId: DreamColumn<Rating, 'userId'>

  @Deco.BelongsTo(['Composition', 'Post'], {
    foreignKey: 'rateableId',
    polymorphic: true,
  })
  public rateable: Composition | Post
  public rateableId: DreamColumn<Rating, 'rateableId'>
  public rateableType: DreamColumn<Rating, 'rateableType'>

  @Deco.BelongsTo(['Post', 'Composition'], {
    foreignKey: 'rateableId',
    polymorphic: true,
    withoutDefaultScopes: ['dream:SoftDelete'],
  })
  public rateableEvenIfDeleted: Composition | Post
}
