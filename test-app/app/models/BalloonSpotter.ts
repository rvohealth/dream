import { Decorators } from '../../../src'
import { DreamColumn, DreamSerializers, Type } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Balloon from './Balloon'
import BalloonSpotterBalloon from './BalloonSpotterBalloon'
import User from './User'

const Decorator = new Decorators<Type<typeof BalloonSpotter>>()

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

  @Decorator.HasMany('BalloonSpotterBalloon')
  public balloonSpotterBalloons: BalloonSpotterBalloon[]

  @Decorator.HasMany('Balloon', { through: 'balloonSpotterBalloons', source: 'balloon' })
  public balloons: Balloon[]

  @Decorator.HasMany('User', { through: 'balloonSpotterBalloons', source: 'user' })
  public users: User[]
}
