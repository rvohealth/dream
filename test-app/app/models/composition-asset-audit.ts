import { HasOne } from '../../../src'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import BeforeUpdate from '../../../src/decorators/hooks/before-update'
import Dream from '../../../src/dream'
import Composition from './composition'
import CompositionAsset from './composition-asset'
import User from './user'

export default class CompositionAssetAudit extends Dream {
  public get table() {
    return 'composition_asset_audits' as const
  }

  public id: number
  public approval: boolean | null

  @BelongsTo(() => CompositionAsset)
  public compositionAsset: CompositionAsset
  public composition_asset_id: number

  @HasOne(() => Composition, {
    through: 'compositionAsset',
    throughClass: () => CompositionAsset,
  })
  public composition: Composition

  @HasOne(() => User, {
    through: 'compositionAsset',
    throughClass: () => CompositionAsset,
  })
  public user: User

  @BeforeUpdate()
  public ensureApprovalIsSet() {
    if (![true, false].includes(this.approval!)) this.approval = false
  }
}
