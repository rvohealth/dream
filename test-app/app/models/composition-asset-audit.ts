import { HasOne } from '../../../src'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { Column } from '../../../src/decorators/column'
import BeforeUpdate from '../../../src/decorators/hooks/before-update'
import Dream from '../../../src/dream'
import Composition from './composition'
import CompositionAsset from './composition-asset'
import User from './user'

export default class CompositionAssetAudit extends Dream {
  public static get table() {
    return 'composition_asset_audits' as const
  }

  @Column('number')
  public id: number

  @Column('number')
  public composition_asset_id: number

  @Column('boolean')
  public approval: boolean | null

  @BelongsTo(() => CompositionAsset)
  public compositionAsset: CompositionAsset

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
