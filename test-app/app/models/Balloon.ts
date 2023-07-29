import { DateTime } from 'luxon'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/dream/types'
import HasOne from '../../../src/decorators/associations/has-one'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import Scope from '../../../src/decorators/scope'
import Validates from '../../../src/decorators/validations/validates'
import User from './User'
import { BalloonColorsEnum, BalloonTypesEnum } from '../../db/schema'
import { BeforeDestroy } from '../../../src'
import BalloonLine from './BalloonLine'

export default class Balloon extends Dream {
  public get table() {
    return 'beautiful_balloons' as const
  }

  public id: IdType
  public type: BalloonTypesEnum
  public color: BalloonColorsEnum
  public multicolor: BalloonColorsEnum[]
  public ribbon_sizes: number[]
  public created_at: DateTime
  public updated_at: DateTime

  @Scope()
  public static red(query: any) {
    return query.where({ color: 'red' })
  }

  @Scope({ default: true })
  public static hideDeleted(query: any) {
    return query.where({ deleted_at: null })
  }

  @BeforeDestroy()
  public async softDelete() {
    await (this as Balloon).update({ deleted_at: DateTime.now() })
    this.preventDeletion()
  }

  @Validates('numericality', { min: 0, max: 100 })
  public volume: number

  @BelongsTo(() => User, { optional: true })
  public user: User
  public user_id: IdType

  @HasOne(() => BalloonLine, { foreignKey: 'balloon_id' })
  public balloonLine: BalloonLine
}
