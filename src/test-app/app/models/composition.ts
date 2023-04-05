import BelongsTo from '../../../associations/belongs-to'
import HasMany from '../../../associations/has-many'
import { Column } from '../../../decorators/column'
import dream from '../../../dream'
import CompositionAsset from './composition-asset'
import CompositionAssetAudit from './composition-asset-audit'
import User from './user'

const Dream = dream('compositions')
export default class Composition extends Dream {
  @Column('number')
  public id: number

  @Column('number')
  public user_id: number

  @BelongsTo('users', () => User)
  public user: User

  @HasMany('composition_assets', () => CompositionAsset)
  public compositionAssets: CompositionAsset[]

  @HasMany('composition_asset_audits', () => CompositionAssetAudit, {
    through: () => CompositionAsset,
    throughKey: 'compositionAssets',
  })
  public compositionAssetAudits: CompositionAssetAudit[]
}
