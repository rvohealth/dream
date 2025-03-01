import { randomBytes, scrypt, timingSafeEqual } from 'crypto'
import { DateTime } from 'luxon'
import { Decorators } from '../../../src'
import Encrypted from '../../../src/decorators/Encrypted'
import BeforeSave from '../../../src/decorators/hooks/BeforeSave'
import Scope from '../../../src/decorators/Scope'
import Validates from '../../../src/decorators/validations/Validates'
import Virtual from '../../../src/decorators/Virtual'
import Query from '../../../src/dream/Query'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types'
import range from '../../../src/helpers/range'
import ApplicationModel from './ApplicationModel'
import Balloon from './Balloon'
import BalloonLine from './BalloonLine'
import Collar from './Collar'
import Composition from './Composition'
import CompositionAsset from './CompositionAsset'
import CompositionAssetAudit from './CompositionAssetAudit'
import HeartRating from './ExtraRating/HeartRating'
import IncompatibleForeignKeyTypeExample from './IncompatibleForeignKeyTypeExample'
import Pet from './Pet'
import Post from './Post'
import PostComment from './PostComment'
import Rating from './Rating'
import UserSettings from './UserSettings'

const Decorator = new Decorators<User>()

export default class User extends ApplicationModel {
  public get table() {
    return 'users' as const
  }

  public get serializers(): DreamSerializers<User> {
    return {
      default: 'UserSerializer',
      summary: 'UserSummarySerializer',
    }
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

  @Encrypted()
  public secret: DreamColumn<User, 'encryptedSecret'>

  @Encrypted('myOtherEncryptedSecret')
  public otherSecret: { token: string } | null

  @Virtual()
  public password: string | undefined
  public passwordDigest: DreamColumn<User, 'passwordDigest'>

  @Validates('contains', '@')
  @Validates('presence')
  @Validates('length', { min: 4, max: 64 })
  public email: DreamColumn<User, 'email'>

  @Decorator.HasOne('UserSettings')
  public userSettings: UserSettings

  @Decorator.HasMany('Post')
  // @Decs.HasMany('Post', { dependent: 'destroy' })
  public posts: Post[]

  @Decorator.HasMany('Post', { withoutDefaultScopes: ['dream:SoftDelete'] })
  public allPosts: Post[]

  @Decorator.HasMany('PostComment', { through: 'posts', source: 'comments' })
  public postComments: PostComment[]

  @Decorator.HasMany('PostComment', {
    through: 'allPosts',
    source: 'allComments',
  })
  public allPostComments: PostComment[]

  @Decorator.HasMany('Rating')
  public ratings: Rating[]

  @Decorator.HasMany('ExtraRating/HeartRating')
  public heartRatings: HeartRating[]

  @Decorator.HasMany('Rating', { through: 'posts', source: 'ratings' })
  public postRatings: Rating[]

  @Decorator.HasOne('Post', { selfOn: { position: 'featuredPostPosition' } })
  public featuredPost: Post

  @Decorator.HasMany('Rating', { through: 'featuredPost', source: 'ratings' })
  public featuredRatings: Rating[]

  @Decorator.HasMany('Rating', {
    through: 'posts',
    source: 'ratings',
    selfOn: { rating: 'targetRating' },
  })
  public ratingsThroughPostsThatMatchUserTargetRating: Rating[]

  @Decorator.HasMany('Composition', { dependent: 'destroy' })
  public compositions: Composition[]

  @Decorator.HasOne('Composition', {
    on: { primary: true },
  })
  public mainComposition: Composition

  @Decorator.HasMany('IncompatibleForeignKeyTypeExample')
  public incompatibleForeignKeyTypeExamples: IncompatibleForeignKeyTypeExample[]

  @Decorator.HasMany('CompositionAsset', {
    through: 'compositions',
  })
  public compositionAssets: CompositionAsset[]

  @Decorator.HasOne('CompositionAsset', {
    through: 'mainComposition',
  })
  public mainCompositionAsset: CompositionAsset

  @Decorator.HasMany('Composition', {
    order: { id: 'desc' },
  })
  public reverseOrderedCompositions: Composition[]

  @Decorator.HasMany('Composition', {
    order: { content: 'asc', id: 'desc' },
  })
  public sortedCompositions: Composition[]

  @Decorator.HasMany('Composition', {
    order: {
      content: 'asc',
      id: 'desc',
    },
  })
  public sortedCompositions2: Composition[]

  @Decorator.HasMany('CompositionAssetAudit', {
    through: 'compositionAssets',
  })
  public compositionAssetAudits: CompositionAssetAudit[]

  // recent associations
  @Decorator.HasMany('Composition', {
    on: { createdAt: () => range(DateTime.now().minus({ week: 1 })) },
  })
  public recentCompositions: Composition[]

  // not recent associations (contrived so that we can test whereNot)
  @Decorator.HasMany('Composition', {
    notOn: { createdAt: () => range(DateTime.now().minus({ week: 1 })) },
  })
  public notRecentCompositions: Composition[]

  @Decorator.HasMany('CompositionAsset', {
    through: 'recentCompositions',
    source: 'compositionAssets',
  })
  public recentCompositionAssets: CompositionAsset[]

  @Decorator.HasMany('CompositionAsset', {
    through: 'recentCompositions',
    source: 'mainCompositionAsset',
  })
  public recentMainCompositionAssets: CompositionAsset[]

  // end:recent associations

  // missing through association
  @Decorator.HasMany('CompositionAsset', { through: 'nonExtantCompositions' as any })
  public nonExtantCompositionAssets1: CompositionAsset[]
  // end: missing through association

  // missing through association source
  @Decorator.HasMany('CompositionAsset', { through: 'compositions' })
  public nonExtantCompositionAssets2: CompositionAsset[]
  // end: missing through association source

  @Decorator.HasMany('Balloon')
  public balloons: Balloon[]

  @Decorator.HasMany('BalloonLine', { through: 'balloons', source: 'balloonLine' })
  public balloonLines: BalloonLine[]

  @Decorator.HasMany('Pet')
  public pets: Pet[]

  // allows us to find hidden pets
  @Decorator.HasMany('Pet', {
    withoutDefaultScopes: ['dream:SoftDelete'],
  })
  public allPets: Pet[]

  @Decorator.HasMany('Pet', { foreignKey: 'userUuid', primaryKeyOverride: 'uuid' })
  public petsFromUuid: Pet[]

  @Decorator.HasOne('Pet', { foreignKey: 'userUuid', primaryKeyOverride: 'uuid' })
  public firstPetFromUuid: Pet

  @Decorator.HasOne('Pet', { on: { name: 'Aster' } })
  public asterPet: Pet

  @Decorator.HasMany('Collar', { through: 'petsFromUuid', source: 'collars' })
  public collarsFromUuid: Collar[]

  @Decorator.HasOne('Collar', { through: 'firstPetFromUuid', source: 'collars' })
  public firstCollarFromUuid: Collar[]

  @Decorator.HasMany('Balloon', { through: 'collarsFromUuid', source: 'balloon' })
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
    if (this.password)
      this.passwordDigest = await insecurePasswordHashSinceBcryptBringsInTooMuchGarbage(this.password)
    this.password = undefined
  }

  public async checkPassword(password: string) {
    if (!this.passwordDigest) return false
    return await insecurePasswordCompareSinceBcryptBringsInTooMuchGarbage(password, this.passwordDigest)
  }
}

const keyLength = 64
/**
 * Has a password or a secret with a password hashing algorithm (scrypt)
 * @param {string} password
 * @returns {string} The salt+hash
 */
export const insecurePasswordHashSinceBcryptBringsInTooMuchGarbage = (password: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString('hex')

    scrypt(password, salt, keyLength, (err, derivedKey) => {
      if (err) reject(err)
      resolve(`${salt}.${derivedKey.toString('hex')}`)
    })
  })
}

/**
 * Compare a plain text password with a salt+hash password
 * @param {string} password The plain text password
 * @param {string} hash The hash+salt to check against
 * @returns {boolean}
 */
export const insecurePasswordCompareSinceBcryptBringsInTooMuchGarbage = (
  password: string,
  hash: string
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const [salt, hashKey] = hash.split('.')
    const hashKeyBuff = Buffer.from(hashKey, 'hex')

    scrypt(password, salt, keyLength, (err, derivedKey) => {
      if (err) reject(err)
      resolve(timingSafeEqual(hashKeyBuff, derivedKey))
    })
  })
}
