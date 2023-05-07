import HasMany from '../../../src/decorators/associations/has-many'
import HasOne from '../../../src/decorators/associations/has-one'
import Scope from '../../../src/decorators/scope'
import Composition from './Composition'
import CompositionAsset from './CompositionAsset'
import CompositionAssetAudit from './CompositionAssetAudit'
import Validates from '../../../src/decorators/validations/validates'
import UserSettings from './UserSettings'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/db/reflections'
import { DateTime } from 'luxon'
import Balloon from './Balloon'
import IncompatibleForeignKeyTypeExample from './IncompatibleForeignKeyTypeExample'

export default class User extends Dream {
  public get table() {
    return 'users' as const
  }

  public id: IdType
  public type: string
  public deleted_at: DateTime
  public created_at: DateTime
  public updated_at: DateTime

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

  @HasMany(() => IncompatibleForeignKeyTypeExample)
  public incompatibleForeignKeyTypeExamples: IncompatibleForeignKeyTypeExample[]

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

  @HasMany(() => Balloon)
  public balloons: Balloon[]

  @Scope()
  public static withFunnyName(query: any) {
    return query.where({ name: 'Chalupas jr' })
  }

  @Scope({ default: true })
  public static hideDeleted(query: any) {
    return query.where({ deleted_at: null })
  }
}
