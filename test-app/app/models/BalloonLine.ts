import { DreamColumn, DreamSerializers } from '../../../src/dream/types.js'
import { Decorators } from '../../../src/index.js'
import ApplicationModel from './ApplicationModel.js'
import Balloon from './Balloon.js'

const Deco = new Decorators<InstanceType<typeof BalloonLine>>()

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

  @Deco.BelongsTo('Balloon', { foreignKey: 'balloonId' })
  public balloon: Balloon
  public balloonId: DreamColumn<BalloonLine, 'balloonId'>
}
