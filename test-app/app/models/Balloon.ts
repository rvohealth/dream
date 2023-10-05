import { DateTime } from 'luxon'
import { IdType } from '../../../src/dream/types'
import HasOne from '../../../src/decorators/associations/has-one'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import Scope from '../../../src/decorators/scope'
import Validates from '../../../src/decorators/validations/validates'
import User from './User'
import { BalloonColorsEnum, BalloonTypesEnum } from '../../db/schema'
import { BeforeDestroy, Query, Sortable } from '../../../src'
import BalloonLine from './BalloonLine'
import ApplicationModel from './ApplicationModel'

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
}
