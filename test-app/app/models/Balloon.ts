import { Query, ReplicaSafe } from '../../../src'
import Scope from '../../../src/decorators/Scope'
import SoftDelete from '../../../src/decorators/SoftDelete'
import Sortable from '../../../src/decorators/Sortable'
import Validates from '../../../src/decorators/validations/Validates'
import { DreamColumn, IdType } from '../../../src/dream/types'
import { BalloonTypesEnum } from '../../db/sync'
import ApplicationModel from './ApplicationModel'
import BalloonLine from './BalloonLine'
import HeartRating from './ExtraRating/HeartRating'
import Sandbag from './Sandbag'
import User from './User'

@ReplicaSafe()
@SoftDelete()
export default class Balloon extends ApplicationModel {
  public get table() {
    return 'beautiful_balloons' as const
  }

  public id: DreamColumn<Balloon, 'id'>
  public color: DreamColumn<Balloon, 'color'>
  public multicolor: DreamColumn<Balloon, 'multicolor'>
  public createdAt: DreamColumn<Balloon, 'createdAt'>
  public updatedAt: DreamColumn<Balloon, 'updatedAt'>

  public get type() {
    return (this as Balloon).getAttribute('type')
  }

  public set type(newType: BalloonTypesEnum) {
    ;(this as Balloon).setAttribute('type', newType)
  }

  @Sortable({ scope: 'user' })
  public positionAlpha: DreamColumn<Balloon, 'positionAlpha'>

  @Scope()
  public static red(query: Query<Balloon>) {
    return query.where({ color: 'red' })
  }

  @Validates('numericality', { min: 0, max: 100 })
  public volume: number

  @Balloon.BelongsTo('User', { optional: true })
  public user: User
  public userId: IdType

  @Balloon.HasOne('BalloonLine', { foreignKey: 'balloonId' })
  public balloonLine: BalloonLine

  @Balloon.HasMany('ExtraRating/HeartRating', { polymorphic: true, foreignKey: 'extraRateableId' })
  public heartRatings: HeartRating[]

  @Balloon.HasMany('Sandbag', { foreignKey: 'balloonId' })
  public sandbags: Sandbag[]
}
