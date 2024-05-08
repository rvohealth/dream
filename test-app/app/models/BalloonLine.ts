import { DateTime } from 'luxon'
import { IdType } from '../../../src/dream/types'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import BalloonLineSerializer from '../../../test-app/app/serializers/BalloonLineSerializer'
import Balloon from './Balloon'
import { BalloonLineMaterialsEnum } from '../../../test-app/db/sync'
import ApplicationModel from './ApplicationModel'

export default class BalloonLine extends ApplicationModel {
  public get table() {
    return 'balloon_lines' as const
  }

  public get serializers() {
    return { default: BalloonLineSerializer }
  }

  public id: IdType
  public material: BalloonLineMaterialsEnum
  public createdAt: DateTime
  public updatedAt: DateTime

  @BelongsTo(() => Balloon, { foreignKey: 'balloonId' })
  public balloon: Balloon
  public balloonId: IdType
}
