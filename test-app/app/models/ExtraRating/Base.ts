import { Decorators } from '../../../../src'
import { DreamColumn, Type } from '../../../../src/dream/types'
import ApplicationModel from '../ApplicationModel'
import Balloon from '../Balloon'
import Composition from '../Composition'
import Post from '../Post'
import User from '../User'

const Decorator = new Decorators<Type<typeof BaseExtraRating>>()

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

  @Decorator.BelongsTo('User')
  public user: User
  public userId: DreamColumn<BaseExtraRating, 'userId'>

  @Decorator.BelongsTo(['Composition', 'Post', 'Balloon'], {
    foreignKey: 'extraRateableId',
    polymorphic: true,
  })
  public extraRateable: Composition | Post | Balloon
}
