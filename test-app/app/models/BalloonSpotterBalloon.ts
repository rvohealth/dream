import { DateTime } from 'luxon'
import { IdType } from '../../../src/dream/types'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import BalloonSpotterBalloonSerializer from '../../../test-app/app/serializers/BalloonSpotterBalloonSerializer'
import BalloonSpotter from './BalloonSpotter'
import Balloon from './Balloon'
import ApplicationModel from './ApplicationModel'
import User from './User'

export default class BalloonSpotterBalloon extends ApplicationModel {
  public get table() {
    return 'balloon_spotter_balloons' as const
  }

  public get serializer() {
    return BalloonSpotterBalloonSerializer
  }

  public id: IdType
  public createdAt: DateTime
  public updatedAt: DateTime

  @BelongsTo(() => User, { optional: true })
  public user: User
  public userId: IdType

  @BelongsTo(() => BalloonSpotter)
  public balloonSpotter: BalloonSpotter
  public balloonSpotterId: IdType

  @BelongsTo(() => Balloon, { foreignKey: 'balloonId' })
  public balloon: Balloon
  public balloonId: IdType
}
