import { DreamColumn } from '../../../src/dream/types.js'
import { Decorators } from '../../../src/index.js'
import ApplicationModel from './ApplicationModel.js'
import Composition from './Composition.js'
import CompositionAsset from './CompositionAsset.js'
import User from './User.js'

const Deco = new Decorators<InstanceType<typeof CompositionAssetAudit>>()

export default class CompositionAssetAudit extends ApplicationModel {
  public get table() {
    return 'composition_asset_audits' as const
  }

  public id: DreamColumn<CompositionAssetAudit, 'id'>
  public approval: DreamColumn<CompositionAssetAudit, 'approval'>
  public notes: DreamColumn<CompositionAssetAudit, 'notes'>

  @Deco.BelongsTo('CompositionAsset')
  public compositionAsset: CompositionAsset
  public compositionAssetId: DreamColumn<CompositionAssetAudit, 'compositionAssetId'>

  @Deco.HasOne('Composition', {
    through: 'compositionAsset',
  })
  public composition: Composition

  @Deco.HasOne('User', {
    through: 'compositionAsset',
  })
  public user: User

  @Deco.BeforeUpdate()
  public ensureApprovalIsSet() {
    if (![true, false].includes(this.approval!)) this.approval = false
  }
}
