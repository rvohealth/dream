import { DreamColumn } from '../../../src/dream/types'
import BalloonSpotterSerializer from '../../../test-app/app/serializers/BalloonSpotterSerializer'
import HasMany from '../../../src/decorators/associations/has-many'
import BalloonSpotterBalloon from './BalloonSpotterBalloon'
import Balloon from './Balloon'
import ApplicationModel from './ApplicationModel'
import User from './User'

export default class BalloonSpotter extends ApplicationModel {
  public get table() {
    return 'balloon_spotters' as const
  }

  public id: DreamColumn<BalloonSpotter, 'id'>
  public name: DreamColumn<BalloonSpotter, 'name'>
  public createdAt: DreamColumn<BalloonSpotter, 'createdAt'>
  public updatedAt: DreamColumn<BalloonSpotter, 'updatedAt'>

  @HasMany(() => BalloonSpotterBalloon)
  public balloonSpotterBalloons: BalloonSpotterBalloon[]

  @HasMany(() => Balloon, { through: 'balloonSpotterBalloons', source: 'balloon' })
  public balloons: Balloon[]

  @HasMany(() => User, { through: 'balloonSpotterBalloons', source: 'user' })
  public users: User[]
}

BalloonSpotter.register('serializers', { default: BalloonSpotterSerializer })
