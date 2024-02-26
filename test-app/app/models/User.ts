import bcrypt from 'bcrypt'
import HasMany from '../../../src/decorators/associations/has-many'
import HasOne from '../../../src/decorators/associations/has-one'
import Scope from '../../../src/decorators/scope'
import Composition from './Composition'
import CompositionAsset from './CompositionAsset'
import CompositionAssetAudit from './CompositionAssetAudit'
import Validates from '../../../src/decorators/validations/validates'
import UserSettings from './UserSettings'
import { IdType } from '../../../src/dream/types'
import { DateTime } from 'luxon'
import Balloon from './Balloon'
import IncompatibleForeignKeyTypeExample from './IncompatibleForeignKeyTypeExample'
import range from '../../../src/helpers/range'
import BeforeSave from '../../../src/decorators/hooks/before-save'
import Virtual from '../../../src/decorators/virtual'
import Pet from './Pet'
import Query from '../../../src/dream/query'
import ApplicationModel from './ApplicationModel'
import BalloonLine from './BalloonLine'
import Post from './Post'
import Rating from './Rating'

export default class User extends ApplicationModel {
  public get table() {
    return 'users' as const
  }

  public id: IdType
  public type: string
  public name: string
  public birthdate: DateTime
  public socialSecurityNumber: string
  public featuredPostPosition: number | null
  public targetRating: number | null
  public deletedAt: DateTime
  public createdAt: DateTime
  public updatedAt: DateTime

  @Virtual()
  public password: string | undefined
  public passwordDigest: string

  @Validates('contains', '@')
  @Validates('presence')
  @Validates('length', { min: 4, max: 18 })
  public email: string

  @HasOne(() => UserSettings)
  public userSettings: UserSettings

  @HasMany(() => Post)
  public posts: Post[]

  @HasMany(() => Rating, { through: 'posts', source: 'ratings' })
  public ratings: Rating[]

  @HasOne(() => Post, { selfWhere: { position: 'featuredPostPosition' } })
  public featuredPost: Post

  @HasMany(() => Rating, { through: 'featuredPost', source: 'ratings' })
  public featuredRatings: Rating[]

  @HasMany(() => Rating, {
    through: 'posts',
    source: 'ratings',
    selfWhere: { rating: 'targetRating' },
  })
  public ratingsThroughPostsThatMatchUserTargetRating: Rating[]

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
  })
  public compositionAssets: CompositionAsset[]

  @HasOne(() => CompositionAsset, {
    through: 'mainComposition',
  })
  public mainCompositionAsset: CompositionAsset

  @HasOne(() => Composition, {
    order: 'id',
  })
  public firstComposition: Composition

  @HasOne(() => Composition, {
    order: { content: 'desc', id: 'asc' },
  })
  public firstComposition2: Composition

  @HasOne(() => Composition, {
    order: { id: 'desc' },
  })
  public lastComposition: Composition

  @HasOne(() => Pet, {
    order: 'name',
  })
  public firstPet: Pet

  @HasMany(() => Composition, {
    order: { content: 'asc', id: 'desc' },
  })
  public sortedCompositions: Composition[]

  @HasMany(() => Composition, {
    order: {
      content: 'asc',
      id: 'desc',
    },
  })
  public sortedCompositions2: Composition[]

  @HasMany(() => CompositionAssetAudit, {
    through: 'compositionAssets',
  })
  public compositionAssetAudits: CompositionAssetAudit[]

  // recent associations
  @HasMany(() => Composition, {
    where: { createdAt: () => range(DateTime.now().minus({ week: 1 })) },
  })
  public recentCompositions: Composition[]

  // not recent associations (contrived so that we can test whereNot)
  @HasMany(() => Composition, {
    whereNot: { createdAt: () => range(DateTime.now().minus({ week: 1 })) },
  })
  public notRecentCompositions: Composition[]

  @HasMany(() => CompositionAsset, {
    through: 'recentCompositions',
    source: 'compositionAssets',
  })
  public recentCompositionAssets: CompositionAsset[]

  @HasMany(() => CompositionAsset, {
    through: 'recentCompositions',
    source: 'mainCompositionAsset',
  })
  public recentMainCompositionAssets: CompositionAsset[]

  // end:recent associations

  // missing through association
  @HasMany(() => CompositionAsset, { through: 'nonExtantCompositions' })
  public nonExtantCompositionAssets1: CompositionAsset[]
  // end: missing through association

  // missing through association source
  @HasMany(() => CompositionAsset, { through: 'compositions' })
  public nonExtantCompositionAssets2: CompositionAsset[]
  // end: missing through association source

  @HasMany(() => Balloon)
  public balloons: Balloon[]

  @HasMany(() => BalloonLine, { through: 'balloons', source: 'balloonLine' })
  public balloonLines: BalloonLine[]

  @HasMany(() => Pet)
  public pets: Pet[]

  @Scope()
  public static withFunnyName(query: Query<typeof User>) {
    return query.where({ name: 'Chalupas jr' })
  }

  @Scope({ default: true })
  public static hideDeleted(query: Query<typeof User>) {
    return query.where({ deletedAt: null })
  }

  @BeforeSave()
  public async hashPass() {
    if (this.password) this.passwordDigest = await bcrypt.hash(this.password, 4)
    this.password = undefined
  }

  public async checkPassword(password: string) {
    if (!this.passwordDigest) return false
    return await bcrypt.compare(password, this.passwordDigest)
  }
}

// const u = new User()
// u.updatenew({ email: 'how!' })
