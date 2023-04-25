import HasMany from '../../../src/decorators/associations/has-many'
import HasOne from '../../../src/decorators/associations/has-one'
import Scope from '../../../src/decorators/scope'
import Composition from './composition'
import CompositionAsset from './composition-asset'
import CompositionAssetAudit from './composition-asset-audit'
import Validates from '../../../src/decorators/validations/validates'
import UserSettings from './user-settings'
import Dream from '../../../src/dream'

export default class User extends Dream {
  public get table() {
    return 'users' as const
  }

  public id: number
  public type: string
  public deleted_at: Date
  public created_at: Date
  public updated_at: Date

  @Validates('contains', '@')
  @Validates('presence')
  public email: string
  public name: string

  @Validates('length', { min: 4, max: 18 })
  public password: string

  @HasOne(() => UserSettings)
  public userSettings: UserSettings

  @HasMany(() => Composition)
  public compositions: Composition[]

  @HasOne(() => Composition, {
    where: { primary: true },
  })
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
