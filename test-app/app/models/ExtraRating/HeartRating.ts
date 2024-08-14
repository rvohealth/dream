import STI from '../../../../src/decorators/STI'
import BelongsTo from '../../../../src/decorators/associations/belongs-to'
import { DreamColumn } from '../../../../src/dream/types'
import Balloon from '../Balloon'
import Composition from '../Composition'
import Post from '../Post'
import User from '../User'
import BaseExtraRating from './Base'

@STI(BaseExtraRating)
export default class HeartRating extends BaseExtraRating {
  @BelongsTo('User')
  public user: User
  public userId: DreamColumn<HeartRating, 'userId'>

  @BelongsTo(() => [Composition, Post, Balloon], {
    foreignKey: 'extraRateableId',
    polymorphic: true,
  })
  public extraRateable: Composition | Post | Balloon
}
