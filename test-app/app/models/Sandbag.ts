import { DateTime } from 'luxon'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/dream/types'
import SandbagSerializer from '../../../test-app/app/serializers/SandbagSerializer'
import Mylar from './Balloon/Mylar'

export default class Sandbag extends Dream {
  public get table() {
    return 'sandbags' as const
  }

  public get serializer() {
    return SandbagSerializer
  }

  public id: IdType
  public weight: number
  public createdAt: DateTime
  public updatedAt: DateTime

  @BelongsTo(() => Mylar, { foreignKey: 'balloonId' })
  public mylar: Mylar
  public balloonId: IdType
}
