import { DreamColumn } from '../../../src/dream/types'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import BalloonLineSerializer from '../../../test-app/app/serializers/BalloonLineSerializer'
import Balloon from './Balloon'
import ApplicationModel from './ApplicationModel'

export default class BalloonLine extends ApplicationModel {
  public get table() {
    return 'balloon_lines' as const
  }

  public id: DreamColumn<BalloonLine, 'id'>
  public material: DreamColumn<BalloonLine, 'material'>
  public createdAt: DreamColumn<BalloonLine, 'createdAt'>
  public updatedAt: DreamColumn<BalloonLine, 'updatedAt'>

  @BelongsTo(() => Balloon, { foreignKey: 'balloonId' })
  public balloon: Balloon
  public balloonId: DreamColumn<BalloonLine, 'balloonId'>
}

BalloonLine.register('serializers', { default: BalloonLineSerializer })
