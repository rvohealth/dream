import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn, IdType } from '../../../src/dream/types.js'
import { Query, ReplicaSafe } from '../../../src/index.js'
import { BalloonTypesEnum } from '../../types/db.js'
import ApplicationModel from './ApplicationModel.js'
import BalloonLine from './BalloonLine.js'
import HeartRating from './ExtraRating/HeartRating.js'
import Sandbag from './Sandbag.js'
import User from './User.js'

const Deco = new Decorators<InstanceType<typeof Balloon>>()

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

  @Deco.Sortable({ scope: 'user' })
  public positionAlpha: DreamColumn<Balloon, 'positionAlpha'>

  @Deco.Sortable({ scope: 'user' })
  public positionBeta: DreamColumn<Balloon, 'positionBeta'>

  @Deco.Scope()
  public static red(query: Query<Balloon>) {
    return query.where({ color: 'red' })
  }

  @Deco.Validates('numericality', { min: 0, max: 100 })
  public volume: number

  @Deco.BelongsTo('User', { optional: true })
  public user: User
  public userId: IdType

  @Deco.HasOne('BalloonLine', { foreignKey: 'balloonId' })
  public balloonLine: BalloonLine

  @Deco.HasMany('ExtraRating/HeartRating', { polymorphic: true, foreignKey: 'extraRateableId' })
  public heartRatings: HeartRating[]

  @Deco.HasMany('Sandbag', { foreignKey: 'balloonId' })
  public sandbags: Sandbag[]

  @Deco.AfterCreate()
  public justToEnsureSortableWorksWithAnAfterCreate() {}
}
