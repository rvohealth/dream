import { Decorators } from '../../../src/index.js'
import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import Balloon from './Balloon.js'
import BalloonSpotterBalloon from './BalloonSpotterBalloon.js'
import User from './User.js'

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
