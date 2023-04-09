import HasMany from '../../../src/decorators/associations/has-many'
import HasOne from '../../../src/decorators/associations/has-one'
import { Column } from '../../../src/decorators/column'
import Scope from '../../../src/decorators/scope'
import dream from '../../../src/dream'
import Composition from './composition'
import CompositionAsset from './composition-asset'
import CompositionAssetAudit from './composition-asset-audit'
import Validates from '../../../src/decorators/validations/validates'

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

  @Column('datetime')
  public created_at: Date

  @Column('datetime')
  public updated_at: Date

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
