import { DateTime } from 'luxon'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/db/reflections'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import Scope from '../../../src/decorators/scope'
import Validates from '../../../src/decorators/validations/validates'
import User from './User'
import { BalloonColorsEnum, BalloonTypesEnum } from '../../db/schema'
import { BeforeDestroy } from '../../../src'

export default class Balloon extends Dream {
  public get table() {
    return 'balloons' as const
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

  @BelongsTo(() => User)
  public user: User
  public user_id: IdType
}
