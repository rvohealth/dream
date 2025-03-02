import { Decorators } from '../../../src'
import { DreamColumn, DreamSerializers, Type } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Balloon from './Balloon'

const Decorator = new Decorators<Type<typeof BalloonLine>>()

export default class BalloonLine extends ApplicationModel {
  public get table() {
    return 'balloon_lines' as const
  }

  public get serializers(): DreamSerializers<BalloonLine> {
    return { default: 'BalloonLineSerializer' }
  }

  public id: DreamColumn<BalloonLine, 'id'>
  public material: DreamColumn<BalloonLine, 'material'>
  public createdAt: DreamColumn<BalloonLine, 'createdAt'>
  public updatedAt: DreamColumn<BalloonLine, 'updatedAt'>

  @Decorator.BelongsTo('Balloon', { foreignKey: 'balloonId' })
  public balloon: Balloon
  public balloonId: DreamColumn<BalloonLine, 'balloonId'>
}
