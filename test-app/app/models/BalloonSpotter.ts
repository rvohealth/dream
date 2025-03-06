import { Decorators } from '../../../src'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Balloon from './Balloon'
import BalloonSpotterBalloon from './BalloonSpotterBalloon'
import User from './User'

const Deco = new Decorators<InstanceType<typeof BalloonSpotter>>()

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

  @Deco.HasMany('BalloonSpotterBalloon')
  public balloonSpotterBalloons: BalloonSpotterBalloon[]

  @Deco.HasMany('Balloon', { through: 'balloonSpotterBalloons', source: 'balloon' })
  public balloons: Balloon[]

  @Deco.HasMany('User', { through: 'balloonSpotterBalloons', source: 'user' })
  public users: User[]
}
