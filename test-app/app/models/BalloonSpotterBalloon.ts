import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Balloon from './Balloon'
import BalloonSpotter from './BalloonSpotter'
import User from './User'

export default class BalloonSpotterBalloon extends ApplicationModel {
  public get table() {
    return 'balloon_spotter_balloons' as const
  }

  public get serializers(): DreamSerializers<BalloonSpotterBalloon> {
    return { default: 'BalloonSpotterBalloonSerializer' }
  }

  public id: DreamColumn<BalloonSpotterBalloon, 'id'>
  public createdAt: DreamColumn<BalloonSpotterBalloon, 'createdAt'>
  public updatedAt: DreamColumn<BalloonSpotterBalloon, 'updatedAt'>

  @BelongsTo('User', { optional: true })
  public user: User
  public userId: DreamColumn<BalloonSpotterBalloon, 'userId'>

  @BelongsTo('BalloonSpotter')
  public balloonSpotter: BalloonSpotter
  public balloonSpotterId: DreamColumn<BalloonSpotterBalloon, 'balloonSpotterId'>

  @BelongsTo('Balloon', { foreignKey: 'balloonId' })
  public balloon: Balloon
  public balloonId: DreamColumn<BalloonSpotterBalloon, 'balloonId'>
}
