import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasOne from '../../../src/decorators/associations/has-one'
import BeforeUpdate from '../../../src/decorators/hooks/before-update'
import { DreamColumn } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Composition from './Composition'
import CompositionAsset from './CompositionAsset'
import User from './User'

export default class CompositionAssetAudit extends ApplicationModel {
  public get table() {
    return 'composition_asset_audits' as const
  }

  public id: DreamColumn<CompositionAssetAudit, 'id'>
  public approval: DreamColumn<CompositionAssetAudit, 'approval'>
  public notes: DreamColumn<CompositionAssetAudit, 'notes'>

  @BelongsTo('CompositionAsset')
  public compositionAsset: CompositionAsset
  public compositionAssetId: DreamColumn<CompositionAssetAudit, 'compositionAssetId'>

  @HasOne('Composition', {
    through: 'compositionAsset',
  })
  public composition: Composition

  @HasOne('User', {
    through: 'compositionAsset',
  })
  public user: User

  @BeforeUpdate()
  public ensureApprovalIsSet() {
    if (![true, false].includes(this.approval!)) this.approval = false
  }
}
