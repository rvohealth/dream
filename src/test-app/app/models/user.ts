import { SelectQueryBuilder } from 'kysely'
import HasMany from '../../../decorators/associations/has-many'
import HasOne from '../../../decorators/associations/has-one'
import { Column } from '../../../decorators/column'
import Scope from '../../../decorators/scope'
import dream from '../../../dream'
import Composition from './composition'
import CompositionAsset from './composition-asset'
import CompositionAssetAudit from './composition-asset-audit'
import Validates from '../../../decorators/validations/validates'

const Dream = dream('users')
export default class User extends Dream {
  @Column('number')
  public id: number

  @Validates('contains', '@')
  @Validates('presence')
  @Column('string')
  public email: string

  @Column('string')
  public name: string

  @Validates('length', { min: 4, max: 18 })
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
    through: 'compositions',
    throughClass: () => Composition,
  })
  public compositionAssets: CompositionAsset[]

  @HasOne('composition_assets', () => CompositionAsset, {
    through: 'compositions',
    throughClass: () => Composition,
  })
  public mainCompositionAsset: CompositionAsset

  @HasMany('composition_asset_audits', () => CompositionAssetAudit, {
    through: 'compositionAssets',
    throughClass: () => CompositionAsset,
  })
  public compositionAssetAudits: CompositionAssetAudit[]

  @HasOne('composition_asset_audits', () => CompositionAssetAudit, {
    through: 'compositionAssets',
    throughClass: () => CompositionAsset,
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
