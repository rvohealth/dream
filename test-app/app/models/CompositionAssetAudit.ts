import HasOne from '../../../src/decorators/associations/has-one'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import BeforeUpdate from '../../../src/decorators/hooks/before-update'
import { IdType } from '../../../src/dream/types'
import Composition from './Composition'
import CompositionAsset from './CompositionAsset'
import User from './User'
import ApplicationModel from './ApplicationModel'

export default class CompositionAssetAudit extends ApplicationModel {
  public get table() {
    return 'composition_asset_audits' as const
  }

  public id: IdType
  public approval: boolean | null

  @BelongsTo(() => CompositionAsset)
  public compositionAsset: CompositionAsset
  public compositionAssetId: IdType

  @HasOne(() => Composition, {
    through: 'compositionAsset',
  })
  public composition: Composition

  @HasOne(() => User, {
    through: 'compositionAsset',
  })
  public user: User

  @BeforeUpdate()
  public ensureApprovalIsSet() {
    if (![true, false].includes(this.approval!)) this.approval = false
  }
}
