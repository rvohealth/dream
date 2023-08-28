import { DateTime } from 'luxon'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/dream/types'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import BalloonLineSerializer from '../../../test-app/app/serializers/BalloonLineSerializer'
import Balloon from './Balloon'
import { BalloonLineMaterialsEnum } from '../../../test-app/db/schema'

export default class BalloonLine extends Dream {
  public get table() {
    return 'balloon_lines' as const
  }

  public get serializer() {
    return BalloonLineSerializer
  }

  public id: IdType
  public material: BalloonLineMaterialsEnum
  public createdAt: DateTime
  public updatedAt: DateTime

  @BelongsTo(() => Balloon, { foreignKey: 'balloonId' })
  public balloon: Balloon
  public balloonId: IdType
}
