import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import Balloon from './Balloon.js'
import BalloonSpotterBalloon from './BalloonSpotterBalloon.js'
import User from './User.js'

const deco = new Decorators<typeof BalloonSpotter>()

export default class BalloonSpotter extends ApplicationModel {
  public override get table() {
    return 'balloon_spotters' as const
  }

  public get serializers(): DreamSerializers<BalloonSpotter> {
    return { default: 'BalloonSpotterSerializer' }
  }

  public id: DreamColumn<BalloonSpotter, 'id'>
  public name: DreamColumn<BalloonSpotter, 'name'>
  public createdAt: DreamColumn<BalloonSpotter, 'createdAt'>
  public updatedAt: DreamColumn<BalloonSpotter, 'updatedAt'>

  @deco.HasMany('BalloonSpotterBalloon')
  public balloonSpotterBalloons: BalloonSpotterBalloon[]

  @deco.HasMany('Balloon', { through: 'balloonSpotterBalloons', source: 'balloon' })
  public balloons: Balloon[]

  @deco.HasMany('User', { through: 'balloonSpotterBalloons', source: 'user' })
  public users: User[]
}
