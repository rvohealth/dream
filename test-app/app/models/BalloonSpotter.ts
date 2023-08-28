import { DateTime } from 'luxon'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/dream/types'
import BalloonSpotterSerializer from '../../../test-app/app/serializers/BalloonSpotterSerializer'
import { HasMany } from '../../../src'
import BalloonSpotterBalloon from './BalloonSpotterBalloon'
import Balloon from './Balloon'

export default class BalloonSpotter extends Dream {
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
}
