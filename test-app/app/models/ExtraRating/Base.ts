import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import Balloon from '../Balloon.js'
import Composition from '../Composition.js'
import Post from '../Post.js'
import User from '../User.js'

const deco = new Decorators<typeof BaseExtraRating>()

export default class BaseExtraRating extends ApplicationModel {
  public override get table() {
    return 'extra_ratings' as const
  }

  public id: DreamColumn<BaseExtraRating, 'id'>
  public type: DreamColumn<BaseExtraRating, 'type'>
  public body: DreamColumn<BaseExtraRating, 'body'>
  public rating: DreamColumn<BaseExtraRating, 'rating'>

  @deco.BelongsTo('User')
  public user: User
  public userId: DreamColumn<BaseExtraRating, 'userId'>

  @deco.BelongsTo(['Composition', 'Post', 'Balloon'], {
    on: 'extraRateableId',
    polymorphic: true,
  })
  public extraRateable: Composition | Post | Balloon
  public extraRateableId: DreamColumn<BaseExtraRating, 'extraRateableId'>
  public extraRateableType: DreamColumn<BaseExtraRating, 'extraRateableType'>
}
