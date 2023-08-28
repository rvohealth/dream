import STI from '../../../../src/decorators/STI'
import BelongsTo from '../../../../src/decorators/associations/belongs-to'
import { IdType } from '../../../../src/dream/types'
import BaseExtraRating from './Base'
import Composition from '../Composition'
import Post from '../Post'
import User from '../User'

@STI(BaseExtraRating)
export default class StarRating extends BaseExtraRating {
  @BelongsTo(() => User)
  public user: User
  public userId: IdType

  @BelongsTo(() => [Composition, Post], {
    foreignKey: 'extraRateableId',
    polymorphic: true,
  })
  public extraRateable: Composition | Post
}
