import { Decorators } from '../../../src/index.js'
import { DreamColumn } from '../../../src/types/dream.js'
import BalloonLineSerializer, { BallonLineSummarySerializer } from '../serializers/BalloonLineSerializer.js'
import ApplicationModel from './ApplicationModel.js'
import Balloon from './Balloon.js'

const deco = new Decorators<typeof BalloonLine>()

export default class BalloonLine extends ApplicationModel {
  public override get table() {
    return 'balloon_lines' as const
  }

  public get serializers() {
    return {
      default: BalloonLineSerializer,
      summary: BallonLineSummarySerializer,
    }
  }

  public id: DreamColumn<BalloonLine, 'id'>
  public material: DreamColumn<BalloonLine, 'material'>
  public createdAt: DreamColumn<BalloonLine, 'createdAt'>
  public updatedAt: DreamColumn<BalloonLine, 'updatedAt'>

  @deco.BelongsTo('Balloon', { foreignKey: 'balloonId' })
  public balloon: Balloon
  public balloonId: DreamColumn<BalloonLine, 'balloonId'>
}
