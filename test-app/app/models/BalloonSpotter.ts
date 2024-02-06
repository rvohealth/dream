import { DateTime } from 'luxon'
import { IdType } from '../../../src/dream/types'
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

  public get serializer() {
    return BalloonSpotterSerializer
  }

  public id: IdType
  public name: string
  public createdAt: DateTime
  public updatedAt: DateTime

  @HasMany(() => BalloonSpotterBalloon)
  public balloonSpotterBalloons: BalloonSpotterBalloon[]

  @HasMany(() => Balloon, { through: 'balloonSpotterBalloons', source: 'balloon' })
  public balloons: Balloon[]

  @HasMany(() => User, { through: 'balloonSpotterBalloons', source: 'user' })
  public users: User[]
}
