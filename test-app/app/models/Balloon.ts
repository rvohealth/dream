import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import Decorators from '../../../src/decorators/Decorators.js'
import { Query, ReplicaSafe } from '../../../src/index.js'
import { DreamColumn, IdType } from '../../../src/types/dream.js'
import { BalloonTypesEnum } from '../../types/db.js'
import ApplicationModel from './ApplicationModel.js'
import BalloonLine from './BalloonLine.js'
import HeartRating from './ExtraRating/HeartRating.js'
import Sandbag from './Sandbag.js'
import User from './User.js'

const deco = new Decorators<InstanceType<typeof Balloon>>()

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

  @deco.Sortable({ scope: 'user' })
  public positionAlpha: DreamColumn<Balloon, 'positionAlpha'>

  @deco.Sortable({ scope: 'user' })
  public positionBeta: DreamColumn<Balloon, 'positionBeta'>

  @deco.Scope()
  public static red(query: Query<Balloon>) {
    return query.where({ color: 'red' })
  }

  @deco.Validates('numericality', { min: 0, max: 100 })
  public volume: number

  @deco.BelongsTo('User', { optional: true })
  public user: User
  public userId: IdType

  @deco.HasOne('BalloonLine', { foreignKey: 'balloonId' })
  public balloonLine: BalloonLine

  @deco.HasMany('ExtraRating/HeartRating', { polymorphic: true, foreignKey: 'extraRateableId' })
  public heartRatings: HeartRating[]

  @deco.HasMany('Sandbag', { foreignKey: 'balloonId' })
  public sandbags: Sandbag[]

  @deco.AfterCreate()
  public justToEnsureSortableWorksWithAnAfterCreate() {}
}
