import STI from '../../../../src/decorators/STI'
import { DreamColumn } from '../../../../src/dream/types'
import Composition from '../Composition'
import Post from '../Post'
import User from '../User'
import BaseExtraRating from './Base'

@STI(BaseExtraRating)
export default class StarRating extends BaseExtraRating {
  @StarRating.BelongsTo('User')
  public user: User
  public userId: DreamColumn<StarRating, 'userId'>

  @StarRating.BelongsTo(['Composition', 'Post'], {
    foreignKey: 'extraRateableId',
    polymorphic: true,
  })
  public extraRateable: Composition | Post
}
