import { Query, ReplicaSafe } from '../../../src'
import Decorators from '../../../src/decorators/Decorators'
import Scope from '../../../src/decorators/Scope'
import SoftDelete from '../../../src/decorators/SoftDelete'
import Validates from '../../../src/decorators/validations/Validates'
import { DreamColumn, IdType, Type } from '../../../src/dream/types'
import { BalloonTypesEnum } from '../../types/db'
import ApplicationModel from './ApplicationModel'
import BalloonLine from './BalloonLine'
import HeartRating from './ExtraRating/HeartRating'
import Sandbag from './Sandbag'
import User from './User'

const Decorator = new Decorators<Type<typeof Balloon>>()

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

  @Decorator.Sortable({ scope: 'user' })
  public positionAlpha: DreamColumn<Balloon, 'positionAlpha'>

  @Scope()
  public static red(query: Query<Balloon>) {
    return query.where({ color: 'red' })
  }

  @Validates('numericality', { min: 0, max: 100 })
  public volume: number

  @Decorator.BelongsTo('User', { optional: true })
  public user: User
  public userId: IdType

  @Decorator.HasOne(['BalloonLine'], { foreignKey: 'balloonId' })
  public balloonLine: BalloonLine

  @Decorator.HasMany('ExtraRating/HeartRating', { polymorphic: true, foreignKey: 'extraRateableId' })
  public heartRatings: HeartRating[]

  @Decorator.HasMany('Sandbag', { foreignKey: 'balloonId' })
  public sandbags: Sandbag[]
}
