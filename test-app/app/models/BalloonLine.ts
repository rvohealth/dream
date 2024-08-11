import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { DreamColumn } from '../../../src/dream/types'
import BalloonLineSerializer from '../../../test-app/app/serializers/BalloonLineSerializer'
import ApplicationModel from './ApplicationModel'
import Balloon from './Balloon'

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

void new Promise<void>(accept => accept())
  .then(() => BalloonLine.register('serializers', { default: BalloonLineSerializer }))
  .catch()
