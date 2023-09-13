import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { IdType } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Composition from './Composition'
import Post from './Post'
import User from './User'

export default class Rating extends ApplicationModel {
  public get table() {
    return 'ratings' as const
  }

  public id: IdType
  public body: string | null
  public rating: number | null

  @BelongsTo(() => User)
  public user: User
  public userId: IdType

  @BelongsTo(() => [Composition, Post], {
    foreignKey: 'rateableId',
    polymorphic: true,
  })
  public rateable: Composition | Post
  public rateableId: IdType
  public rateableType: string
}
