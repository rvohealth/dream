import HasMany from '../../../src/decorators/associations/has-many'
import HasOne from '../../../src/decorators/associations/has-one'
import { Column } from '../../../src/decorators/column'
import Scope from '../../../src/decorators/scope'
import dream from '../../../src/dream'
import Composition from './composition'
import CompositionAsset from './composition-asset'
import CompositionAssetAudit from './composition-asset-audit'
import Validates from '../../../src/decorators/validations/validates'
import UserSettings from './user-settings'

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

  @HasOne(() => UserSettings)
  public userSettings: UserSettings

  @HasMany(() => Composition)
  public compositions: Composition[]

  @HasOne(() => Composition)
  public mainComposition: Composition

  @HasMany(() => CompositionAsset, {
    through: 'compositions',
    throughClass: () => Composition,
  })
  public compositionAssets: CompositionAsset[]

  @HasOne(() => CompositionAsset, {
    through: 'mainComposition',
    throughClass: () => Composition,
  })
  public mainCompositionAsset: CompositionAsset

  @HasMany(() => CompositionAssetAudit, {
    through: 'compositionAssets',
    throughClass: () => CompositionAsset,
  })
  public compositionAssetAudits: CompositionAssetAudit[]

  @Scope()
  public static withFunnyName(query: any) {
    return query.where({ name: 'Chalupas jr' })
  }

  @Scope({ default: true })
  public static hideDeleted(query: any) {
    return query.where({ deleted_at: null })
  }
}
