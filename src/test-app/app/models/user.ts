import HasMany from '../../../associations/has-many'
import HasOne from '../../../associations/has-one'
import { Column } from '../../../decorators/column'
import dream from '../../../dream'
import Composition from './composition'
import CompositionAsset from './composition-asset'
import CompositionAssetAudit from './composition-asset-audit'

const Dream = dream('users')
export default class User extends Dream {
  @Column('number')
  public id: number

  @Column('string')
  public email: string

  @Column('string')
  public name: string

  @Column('string')
  public password: string

  @HasMany('compositions', () => Composition)
  public compositions: Composition[]

  @HasOne('compositions', () => Composition)
  public mainComposition: Composition

  @HasMany('composition_assets', () => CompositionAsset, {
    through: () => Composition,
    throughKey: 'compositions',
  })
  public compositionAssets: CompositionAsset[]

  @HasOne('composition_assets', () => CompositionAsset, {
    through: () => Composition,
    throughKey: 'compositions',
  })
  public mainCompositionAsset: CompositionAsset

  @HasMany('composition_asset_audits', () => CompositionAssetAudit, {
    through: () => CompositionAsset,
    throughKey: 'compositionAssets',
  })
  public compositionAssetAudits: CompositionAssetAudit[]

  @HasOne('composition_asset_audits', () => CompositionAssetAudit, {
    through: () => CompositionAsset,
    throughKey: 'mainCompositionAssetAudit',
  })
  public mainCompositionAssetAudit: CompositionAssetAudit
}
