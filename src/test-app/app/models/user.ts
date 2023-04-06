import { SelectQueryBuilder } from 'kysely'
import HasMany from '../../../decorators/associations/has-many'
import HasOne from '../../../decorators/associations/has-one'
import { Column } from '../../../decorators/column'
import Scope from '../../../decorators/scope'
import dream from '../../../dream'
import Composition from './composition'
import CompositionAsset from './composition-asset'
import CompositionAssetAudit from './composition-asset-audit'
import { DB } from '../../db/schema'

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

  @Column('string')
  public type: string

  @Column('datetime')
  public deleted_at: Date

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
    throughKey: 'compositionAssets',
  })
  public mainCompositionAssetAudit: CompositionAssetAudit

  @Scope()
  public static withFunnyName(query: any) {
    return query.where({ name: 'Chalupas jr' })
  }
  @Scope({ default: true })
  public static hideDeleted(query: any) {
    return query.where({ deleted_at: null })
  }
}
