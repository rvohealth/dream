import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import Composition from './Composition.js'
import CompositionAsset from './CompositionAsset.js'
import User from './User.js'

const deco = new Decorators<typeof CompositionAssetAudit>()

export default class CompositionAssetAudit extends ApplicationModel {
  public override get table() {
    return 'composition_asset_audits' as const
  }

  public id: DreamColumn<CompositionAssetAudit, 'id'>
  public approval: DreamColumn<CompositionAssetAudit, 'approval'>
  public notes: DreamColumn<CompositionAssetAudit, 'notes'>

  @deco.BelongsTo('CompositionAsset')
  public compositionAsset: CompositionAsset
  public compositionAssetId: DreamColumn<CompositionAssetAudit, 'compositionAssetId'>

  @deco.HasOne('Composition', {
    through: 'compositionAsset',
  })
  public composition: Composition

  @deco.HasOne('User', {
    through: 'compositionAsset',
  })
  public user: User

  @deco.BeforeUpdate()
  public ensureApprovalIsSet() {
    if (![true, false].includes(this.approval!)) this.approval = false
  }
}
