import { DreamColumn, DreamSerializers } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Balloon from './Balloon'
import BalloonSpotterBalloon from './BalloonSpotterBalloon'
import User from './User'

export default class BalloonSpotter extends ApplicationModel {
  public get table() {
    return 'balloon_spotters' as const
  }

  public get serializers(): DreamSerializers<BalloonSpotter> {
    return { default: 'BalloonSpotterSerializer' }
  }

  public id: DreamColumn<BalloonSpotter, 'id'>
  public name: DreamColumn<BalloonSpotter, 'name'>
  public createdAt: DreamColumn<BalloonSpotter, 'createdAt'>
  public updatedAt: DreamColumn<BalloonSpotter, 'updatedAt'>

  @BalloonSpotter.HasMany('BalloonSpotterBalloon')
  public balloonSpotterBalloons: BalloonSpotterBalloon[]

  @BalloonSpotter.HasMany('Balloon', { through: 'balloonSpotterBalloons', source: 'balloon' })
  public balloons: Balloon[]

  @BalloonSpotter.HasMany('User', { through: 'balloonSpotterBalloons', source: 'user' })
  public users: User[]
}
