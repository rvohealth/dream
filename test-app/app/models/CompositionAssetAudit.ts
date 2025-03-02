import { Decorators } from '../../../src'
import { DreamColumn, Type } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Composition from './Composition'
import CompositionAsset from './CompositionAsset'
import User from './User'

const Decorator = new Decorators<Type<typeof CompositionAssetAudit>>()

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

  @Decorator.BeforeUpdate()
  public ensureApprovalIsSet() {
    if (![true, false].includes(this.approval!)) this.approval = false
  }
}
