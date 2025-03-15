import { DreamColumn } from '../../../../src/dream/types.js'
import { Decorators } from '../../../../src/index.js'
import ApplicationModel from '../ApplicationModel.js'
import Balloon from '../Balloon.js'
import Composition from '../Composition.js'
import Post from '../Post.js'
import User from '../User.js'

const Deco = new Decorators<InstanceType<typeof BaseExtraRating>>()

export default class BaseExtraRating extends ApplicationModel {
  public get table() {
    return 'extra_ratings' as const
  }

  public get serializers() {
    throw new Error('Define serializers in STI children')
  }

  public id: DreamColumn<BaseExtraRating, 'id'>
  public body: DreamColumn<BaseExtraRating, 'body'>
  public rating: DreamColumn<BaseExtraRating, 'rating'>

  public extraRateableId: DreamColumn<BaseExtraRating, 'extraRateableId'>
  public extraRateableType: DreamColumn<BaseExtraRating, 'extraRateableType'>

  @Deco.BelongsTo('User')
  public user: User
  public userId: DreamColumn<BaseExtraRating, 'userId'>

  @Deco.BelongsTo(['Composition', 'Post', 'Balloon'], {
    foreignKey: 'extraRateableId',
    polymorphic: true,
  })
  public extraRateable: Composition | Post | Balloon
}
