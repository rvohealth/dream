import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { Column } from '../../../src/decorators/column'
import BeforeUpdate from '../../../src/decorators/hooks/before-update'
import dream from '../../../src/dream'
import Composition from './composition'
import CompositionAsset from './composition-asset'
import User from './user'

const Dream = dream('composition_asset_audits')
export default class CompositionAssetAudit extends Dream {
  @Column('number')
  public id: number

  @Column('number')
  public composition_asset_id: number

  @Column('boolean')
  public approval: boolean | null

  @BelongsTo('composition_assets', () => CompositionAsset)
  public compositionAsset: CompositionAsset

  @BeforeUpdate()
  public ensureApprovalIsSet() {
    if (![true, false].includes(this.approval!)) this.approval = false
  }
}
