import { DateTime } from 'luxon'
import { DreamColumn, IdType } from '../../../src/dream/types'
import HasOne from '../../../src/decorators/associations/has-one'
import Scope from '../../../src/decorators/scope'
import Validates from '../../../src/decorators/validations/validates'
import { BalloonTypesEnum } from '../../db/sync'
import BalloonLine from './BalloonLine'
import ApplicationModel from './ApplicationModel'
import Sortable from '../../../src/decorators/sortable'
import BeforeDestroy from '../../../src/decorators/hooks/before-destroy'
import Query from '../../../src/dream/query'
import User from './User'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import HeartRating from './ExtraRating/HeartRating'

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
  public static red(query: any) {
    return query.where({ color: 'red' })
  }

  @Scope({ default: true })
  public static hideDeleted(query: any) {
    return query.where({ deletedAt: null })
  }

  @BeforeDestroy()
  public async softDelete(this: Balloon) {
    await new Query(this)
      .toKysely('update')
      .set({ deletedAt: DateTime.now(), positionAlpha: null, positionBeta: null })
      .where(this.primaryKey as any, '=', this.primaryKeyValue!.toString())
      .execute()

    this.preventDeletion()
  }

  @Validates('numericality', { min: 0, max: 100 })
  public volume: number

  @BelongsTo(() => User, { optional: true })
  public user: User
  public userId: IdType

  @HasOne(() => BalloonLine, { foreignKey: 'balloonId' })
  public balloonLine: BalloonLine

  @HasMany(() => HeartRating, { polymorphic: true, foreignKey: 'extraRateableId' })
  public heartRatings: HeartRating[]
}
