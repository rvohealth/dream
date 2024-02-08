import { DateTime } from 'luxon'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { IdType } from '../../../src/dream/types'
import SandbagSerializer from '../../../test-app/app/serializers/SandbagSerializer'
import Mylar from './Balloon/Mylar'
import ApplicationModel from './ApplicationModel'
import Validate from '../../../src/decorators/validations/validate'

export default class Sandbag extends ApplicationModel {
  public get table() {
    return 'sandbags' as const
  }

  public get serializer() {
    return SandbagSerializer
  }

  public id: IdType
  public weight: number
  public weightKgs: number
  public weightTons: number
  public createdAt: DateTime
  public updatedAt: DateTime

  @Validate()
  public validateWeight(this: Sandbag) {
    if (!this.weight) return

    const undefinedOrNull: any[] = [undefined, null]
    if (!undefinedOrNull.includes(this.weightKgs))
      this.addError('weight', 'cannot include weightKgs AND weight')
    if (!undefinedOrNull.includes(this.weightTons))
      this.addError('weight', 'cannot include weightTons AND weight')
  }

  @BelongsTo(() => Mylar, { foreignKey: 'balloonId' })
  public mylar: Mylar
  public balloonId: IdType
}
