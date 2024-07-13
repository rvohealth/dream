import bcrypt from 'bcrypt'
import { DateTime } from 'luxon'
import HasMany from '../../../src/decorators/associations/has-many'
import HasOne from '../../../src/decorators/associations/has-one'
import BeforeSave from '../../../src/decorators/hooks/before-save'
import Scope from '../../../src/decorators/scope'
import Validates from '../../../src/decorators/validations/validates'
import Virtual from '../../../src/decorators/virtual'
import Query from '../../../src/dream/query'
import { DreamColumn } from '../../../src/dream/types'
import range from '../../../src/helpers/range'
import UserSerializer, { UserSummarySerializer } from '../serializers/UserSerializer'
import ApplicationModel from './ApplicationModel'
import Balloon from './Balloon'
import BalloonLine from './BalloonLine'
import Collar from './Collar'
import Composition from './Composition'
import CompositionAsset from './CompositionAsset'
import CompositionAssetAudit from './CompositionAssetAudit'
import IncompatibleForeignKeyTypeExample from './IncompatibleForeignKeyTypeExample'
import Pet from './Pet'
import Post from './Post'
import PostComment from './PostComment'
import Rating from './Rating'
import UserSettings from './UserSettings'

export default class User extends ApplicationModel {
  public get table() {
    return 'users' as const
  }

  public get serializers() {
    return {
      default: UserSerializer<any, any>,
      summary: UserSummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<User, 'id'>
  public uuid: DreamColumn<User, 'uuid'>
  public name: DreamColumn<User, 'name'>
  public birthdate: DreamColumn<User, 'birthdate'>
  public socialSecurityNumber: DreamColumn<User, 'socialSecurityNumber'>
  public favoriteWord: DreamColumn<User, 'favoriteWord'>
  public favoriteNumbers: DreamColumn<User, 'favoriteNumbers'>
  public featuredPostPosition: DreamColumn<User, 'featuredPostPosition'>
  public targetRating: DreamColumn<User, 'targetRating'>
  public deletedAt: DreamColumn<User, 'deletedAt'>
  public createdAt: DreamColumn<User, 'createdAt'>
  public updatedAt: DreamColumn<User, 'updatedAt'>

  @Virtual()
  public password: string | undefined
  public passwordDigest: DreamColumn<User, 'passwordDigest'>

  @Validates('contains', '@')
  @Validates('presence')
  @Validates('length', { min: 4, max: 18 })
  public email: DreamColumn<User, 'email'>

  @HasOne(() => UserSettings)
  public userSettings: UserSettings

  @HasMany(() => Post, { dependent: 'destroy' })
  public posts: Post[]

  @HasMany(() => PostComment, { through: 'posts', source: 'comments' })
  public postComments: PostComment[]

  @HasMany(() => Rating)
  public ratings: Rating[]

  @HasMany(() => Rating, { through: 'posts', source: 'ratings' })
  public postRatings: Rating[]

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

  @HasMany(() => Composition, { dependent: 'destroy' })
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

  // allows us to find hidden pets
  @HasMany(() => Pet, {
    withoutDefaultScopes: ['dream:SoftDelete'],
  })
  public allPets: Pet[]

  @User.HasMany(() => Pet, { foreignKey: 'userUuid', primaryKeyOverride: 'uuid' })
  public petsFromUuid: Pet[]

  @User.HasOne(() => Pet, { foreignKey: 'userUuid', primaryKeyOverride: 'uuid' })
  public firstPetFromUuid: Pet

  @User.HasMany(() => Collar, { through: 'petsFromUuid', source: 'collars' })
  public collarsFromUuid: Collar[]

  @User.HasOne(() => Collar, { through: 'firstPetFromUuid', source: 'collars' })
  public firstCollarFromUuid: Collar[]

  @User.HasMany(() => Balloon, { through: 'collarsFromUuid', source: 'balloon' })
  public balloonsFromUuid: Collar[]

  @Scope()
  public static withFunnyName(query: Query<User>) {
    return query.where({ name: 'Chalupas jr' })
  }

  @Scope({ default: true })
  public static hideDeleted(query: Query<User>) {
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
