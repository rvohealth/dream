import { DateTime } from 'luxon'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/db/reflections'
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
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => Mylar, { foreignKey: 'balloon_id' })
  public mylar: Mylar
  public balloon_id: IdType
}
