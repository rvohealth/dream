import { DateTime } from 'luxon'
import { IdType } from '../../../src/dream/types'
import HasOne from '../../../src/decorators/associations/has-one'
import Scope from '../../../src/decorators/scope'
import Validates from '../../../src/decorators/validations/validates'
import { BalloonColorsEnum, BalloonTypesEnum } from '../../db/schema'
import BalloonLine from './BalloonLine'
import ApplicationModel from './ApplicationModel'
import Sortable from '../../../src/decorators/sortable'
import BeforeDestroy from '../../../src/decorators/hooks/before-destroy'
import Query from '../../../src/dream/query'
import User from './User'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import HeartRating from './ExtraRating/HeartRating'
import Collar from './Collar'

export default class Balloon extends ApplicationModel {
  public get table() {
    return 'beautiful_balloons' as const
  }

  public id: IdType
  public type: BalloonTypesEnum
  public color: BalloonColorsEnum
  public multicolor: BalloonColorsEnum[]
  public ribbonSizes: number[]
  public createdAt: DateTime
  public updatedAt: DateTime

  @Sortable({ scope: 'user' })
  public positionAlpha: number

  @Scope()
  public static red(query: any) {
    return query.where({ color: 'red' })
  }

  @Scope({ default: true })
  public static hideDeleted(query: any) {
    return query.where({ deletedAt: null })
  }

  @BeforeDestroy()
  public async softDelete() {
    await new Query(this.constructor as typeof Balloon)
      .toKysely('update')
      .set({ deletedAt: DateTime.now(), positionAlpha: null, positionBeta: null })
      .where(this.primaryKey, '=', this.primaryKeyValue)
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
