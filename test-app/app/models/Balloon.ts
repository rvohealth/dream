import { Query } from '../../../src'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import HasOne from '../../../src/decorators/associations/has-one'
import Scope from '../../../src/decorators/scope'
import SoftDelete from '../../../src/decorators/soft-delete'
import Sortable from '../../../src/decorators/sortable'
import Validates from '../../../src/decorators/validations/validates'
import { DreamColumn, IdType } from '../../../src/dream/types'
import { BalloonTypesEnum } from '../../db/sync'
import ApplicationModel from './ApplicationModel'
import BalloonLine from './BalloonLine'
import HeartRating from './ExtraRating/HeartRating'
import User from './User'

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

  @BelongsTo('User', { optional: true })
  public user: User
  public userId: IdType

  @HasOne('BalloonLine', { foreignKey: 'balloonId' })
  public balloonLine: BalloonLine

  @HasMany('HeartRating', { polymorphic: true, foreignKey: 'extraRateableId' })
  public heartRatings: HeartRating[]
}
