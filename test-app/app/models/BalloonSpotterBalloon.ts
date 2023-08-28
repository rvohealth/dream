import { DateTime } from 'luxon'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/dream/types'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import BalloonSpotterBalloonSerializer from '../../../test-app/app/serializers/BalloonSpotterBalloonSerializer'
import BalloonSpotter from './BalloonSpotter'
import Balloon from './Balloon'

export default class BalloonSpotterBalloon extends Dream {
  public get table() {
    return 'balloon_spotter_balloons' as const
  }

  public get serializer() {
    return BalloonSpotterBalloonSerializer
  }

  public id: IdType
  public createdAt: DateTime
  public updatedAt: DateTime

  @BelongsTo(() => BalloonSpotter)
  public balloonSpotter: BalloonSpotter
  public balloonSpotterId: IdType

  @BelongsTo(() => Balloon, { foreignKey: 'balloonId' })
  public balloon: Balloon
  public balloonId: IdType
}
