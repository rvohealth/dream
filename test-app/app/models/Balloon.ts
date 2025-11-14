import ReplicaSafe from '../../../src/decorators/class/ReplicaSafe.js'
import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import Decorators from '../../../src/decorators/Decorators.js'
import Query from '../../../src/dream/Query.js'
import { DreamColumn } from '../../../src/types/dream.js'
import { BalloonTypesEnum } from '../../types/db.js'
import ApplicationModel from './ApplicationModel.js'
import BalloonLine from './BalloonLine.js'
import HeartRating from './ExtraRating/HeartRating.js'
import Sandbag from './Sandbag.js'
import Shape from './Shape.js'
import User from './User.js'

const deco = new Decorators<typeof Balloon>()

@ReplicaSafe()
@SoftDelete()
export default class Balloon extends ApplicationModel {
  public override get table() {
    return 'beautiful_balloons' as const
  }

  public id: DreamColumn<Balloon, 'id'>
  public color: DreamColumn<Balloon, 'color'>
  public multicolor: DreamColumn<Balloon, 'multicolor'>
  public createdAt: DreamColumn<Balloon, 'createdAt'>
  public updatedAt: DreamColumn<Balloon, 'updatedAt'>

  public myString: { value: string } = { value: 'howyd-do' }

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
  public userId: DreamColumn<Balloon, 'userId'>

  @deco.HasOne('BalloonLine', { on: 'balloonId' })
  public balloonLine: BalloonLine

  @deco.HasMany('ExtraRating/HeartRating', { polymorphic: true, on: 'extraRateableId' })
  public heartRatings: HeartRating[]

  @deco.HasMany('Sandbag', { on: 'balloonId' })
  public sandbags: Sandbag[]

  @deco.BelongsTo(['Shape'], {
    on: 'shapableId',
    polymorphic: true,
    optional: true,
  })
  public shapable: Shape
  public shapableId: DreamColumn<Balloon, 'shapableId'>
  public shapableType: DreamColumn<Balloon, 'shapableType'>

  @deco.AfterCreate()
  public justToEnsureSortableWorksWithAnAfterCreate() {}
}
