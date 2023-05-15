import bcrypt from 'bcrypt'
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
import { BeforeSave } from '../../../src'
import Virtual from '../../../src/decorators/virtual'
import Pet from './Pet'

export default class User extends Dream {
  public get table() {
    return 'users' as const
  }

  public id: IdType
  public type: string
  public deleted_at: DateTime
  public created_at: DateTime
  public updated_at: DateTime

  @Virtual()
  public password: string | undefined
  public password_digest: string

  @Validates('contains', '@')
  @Validates('presence')
  @Validates('length', { min: 4, max: 18 })
  public email: string
  public name: string

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

  @HasMany(() => Pet)
  public pets: Pet[]

  @Scope()
  public static withFunnyName(query: any) {
    return query.where({ name: 'Chalupas jr' })
  }

  @Scope({ default: true })
  public static hideDeleted(query: any) {
    return query.where({ deleted_at: null })
  }

  @BeforeSave()
  public async hashPass() {
    if (this.password) this.password_digest = await bcrypt.hash(this.password, 4)
    this.password = undefined
  }

  public async checkPassword(password: string) {
    if (!this.password_digest) return false
    return await bcrypt.compare(password, this.password_digest)
  }
}
