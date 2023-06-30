import STI from '../../../../src/decorators/STI'
import BelongsTo from '../../../../src/decorators/associations/belongs-to'
import { IdType } from '../../../../src/db/reflections'
import BaseExtraRating from './Base'
import Composition from '../Composition'
import Post from '../Post'
import User from '../User'

@STI(BaseExtraRating)
export default class HeartRating extends BaseExtraRating {
  @BelongsTo(() => User)
  public user: User
  public user_id: IdType

  @BelongsTo(() => [Composition, Post], {
    foreignKey: 'extra_rateable_id',
    polymorphic: true,
  })
  public extraRateable: Composition | Post
}
