import { Decorators } from '../../../src'
import BeforeUpdate from '../../../src/decorators/hooks/BeforeUpdate'
import { DreamColumn } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Composition from './Composition'
import CompositionAsset from './CompositionAsset'
import User from './User'

const Decorator = new Decorators<CompositionAssetAudit>()

export default class CompositionAssetAudit extends ApplicationModel {
  public get table() {
    return 'composition_asset_audits' as const
  }

  public id: DreamColumn<CompositionAssetAudit, 'id'>
  public approval: DreamColumn<CompositionAssetAudit, 'approval'>
  public notes: DreamColumn<CompositionAssetAudit, 'notes'>

  @Decorator.BelongsTo('CompositionAsset')
  public compositionAsset: CompositionAsset
  public compositionAssetId: DreamColumn<CompositionAssetAudit, 'compositionAssetId'>

  @Decorator.HasOne('Composition', {
    through: 'compositionAsset',
  })
  public composition: Composition

  @Decorator.HasOne('User', {
    through: 'compositionAsset',
  })
  public user: User

  @BeforeUpdate()
  public ensureApprovalIsSet() {
    if (![true, false].includes(this.approval!)) this.approval = false
  }
}
