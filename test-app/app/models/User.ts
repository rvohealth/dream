import { randomBytes, scrypt, timingSafeEqual } from 'crypto'
import { DateTime } from 'luxon'
import Query from '../../../src/dream/Query.js'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types.js'
import range from '../../../src/helpers/range.js'
import { Decorators, round } from '../../../src/index.js'
import ApplicationModel from './ApplicationModel.js'
import Balloon from './Balloon.js'
import BalloonLine from './BalloonLine.js'
import Collar from './Collar.js'
import Composition from './Composition.js'
import CompositionAsset from './CompositionAsset.js'
import CompositionAssetAudit from './CompositionAssetAudit.js'
import HeartRating from './ExtraRating/HeartRating.js'
import IncompatibleForeignKeyTypeExample from './IncompatibleForeignKeyTypeExample.js'
import Pet from './Pet.js'
import Post from './Post.js'
import PostComment from './PostComment.js'
import Rating from './Rating.js'
import UserSettings from './UserSettings.js'

const Deco = new Decorators<InstanceType<typeof User>>()

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

  @Deco.Encrypted()
  public secret: DreamColumn<User, 'encryptedSecret'>

  @Deco.Encrypted('myOtherEncryptedSecret')
  public otherSecret: { token: string } | null

  @Deco.Virtual()
  public password: string | undefined
  public passwordDigest: DreamColumn<User, 'passwordDigest'>

  @Deco.Virtual()
  public randoVirtual: string

  @Deco.Virtual('number')
  public get lbs() {
    const self: User = this
    return gramsToLbs(self.getAttribute('grams') ?? 0)
  }

  public set lbs(lbs: number) {
    const self: User = this
    self.setAttribute('grams', lbsToGrams(lbs))
  }

  @Deco.Virtual({ type: 'number', nullable: true })
  public set kilograms(kg: number) {
    const self: User = this
    self.setAttribute('grams', kilogramsToGrams(kg))
  }

  public get kilograms() {
    const self: User = this
    return gramsToKilograms(self.getAttribute('grams') ?? 0)
  }

  @Deco.Validates('contains', '@')
  @Deco.Validates('presence')
  @Deco.Validates('length', { min: 4, max: 64 })
  public email: DreamColumn<User, 'email'>

  @Deco.HasOne('UserSettings')
  public userSettings: UserSettings

  @Deco.HasMany('Post')
  // @Deco.HasMany('Post', { dependent: 'destroy' })
  public posts: Post[]

  @Deco.HasMany('Post', { withoutDefaultScopes: ['dream:SoftDelete'] })
  public allPosts: Post[]

  @Deco.HasMany('PostComment', { through: 'posts', source: 'comments' })
  public postComments: PostComment[]

  @Deco.HasMany('PostComment', {
    through: 'allPosts',
    source: 'allComments',
  })
  public allPostComments: PostComment[]

  @Deco.HasMany('Rating')
  public ratings: Rating[]

  @Deco.HasMany('ExtraRating/HeartRating')
  public heartRatings: HeartRating[]

  @Deco.HasMany('Rating', { through: 'posts', source: 'ratings' })
  public postRatings: Rating[]

  @Deco.HasOne('Post', { selfOn: { position: 'featuredPostPosition' } })
  public featuredPost: Post

  @Deco.HasMany('Rating', { through: 'featuredPost', source: 'ratings' })
  public featuredRatings: Rating[]

  @Deco.HasMany('Rating', {
    through: 'posts',
    source: 'ratings',
    selfOn: { rating: 'targetRating' },
  })
  public ratingsThroughPostsThatMatchUserTargetRating: Rating[]

  @Deco.HasMany('Composition', { dependent: 'destroy' })
  public compositions: Composition[]

  @Deco.HasOne('Composition', {
    on: { primary: true },
  })
  public mainComposition: Composition

  @Deco.HasMany('IncompatibleForeignKeyTypeExample')
  public incompatibleForeignKeyTypeExamples: IncompatibleForeignKeyTypeExample[]

  @Deco.HasMany('CompositionAsset', {
    through: 'compositions',
  })
  public compositionAssets: CompositionAsset[]

  @Deco.HasOne('CompositionAsset', {
    through: 'mainComposition',
  })
  public mainCompositionAsset: CompositionAsset

  @Deco.HasMany('Composition', {
    order: { id: 'desc' },
  })
  public reverseOrderedCompositions: Composition[]

  @Deco.HasMany('Composition', {
    order: { content: 'asc', id: 'desc' },
  })
  public sortedCompositions: Composition[]

  @Deco.HasMany('Composition', {
    order: {
      content: 'asc',
      id: 'desc',
    },
  })
  public sortedCompositions2: Composition[]

  @Deco.HasMany('CompositionAssetAudit', {
    through: 'compositionAssets',
  })
  public compositionAssetAudits: CompositionAssetAudit[]

  // recent associations
  @Deco.HasMany('Composition', {
    on: { createdAt: () => range(DateTime.now().minus({ week: 1 })) },
  })
  public recentCompositions: Composition[]

  // not recent associations (contrived so that we can test whereNot)
  @Deco.HasMany('Composition', {
    notOn: { createdAt: () => range(DateTime.now().minus({ week: 1 })) },
  })
  public notRecentCompositions: Composition[]

  @Deco.HasMany('CompositionAsset', {
    through: 'recentCompositions',
    source: 'compositionAssets',
  })
  public recentCompositionAssets: CompositionAsset[]

  @Deco.HasMany('CompositionAsset', {
    through: 'recentCompositions',
    source: 'mainCompositionAsset',
  })
  public recentMainCompositionAssets: CompositionAsset[]

  // end:recent associations

  // missing through association
  @Deco.HasMany('CompositionAsset', { through: 'nonExtantCompositions' as any })
  public nonExtantCompositionAssets1: CompositionAsset[]
  // end: missing through association

  // missing through association source
  @Deco.HasMany('CompositionAsset', { through: 'compositions' })
  public nonExtantCompositionAssets2: CompositionAsset[]
  // end: missing through association source

  @Deco.HasMany('Balloon')
  public balloons: Balloon[]

  @Deco.HasMany('BalloonLine', { through: 'balloons', source: 'balloonLine' })
  public balloonLines: BalloonLine[]

  @Deco.HasMany('Pet')
  public pets: Pet[]

  // allows us to find hidden pets
  @Deco.HasMany('Pet', {
    withoutDefaultScopes: ['dream:SoftDelete'],
  })
  public allPets: Pet[]

  @Deco.HasMany('Pet', { foreignKey: 'userUuid', primaryKeyOverride: 'uuid' })
  public petsFromUuid: Pet[]

  @Deco.HasOne('Pet', { foreignKey: 'userUuid', primaryKeyOverride: 'uuid' })
  public firstPetFromUuid: Pet

  @Deco.HasOne('Pet', { on: { name: 'Aster' } })
  public asterPet: Pet

  @Deco.HasMany('Collar', { through: 'petsFromUuid', source: 'collars' })
  public collarsFromUuid: Collar[]

  @Deco.HasOne('Collar', { through: 'firstPetFromUuid', source: 'collars' })
  public firstCollarFromUuid: Collar[]

  @Deco.HasMany('Balloon', { through: 'collarsFromUuid', source: 'balloon' })
  public balloonsFromUuid: Collar[]

  @Deco.Scope()
  public static withFunnyName(query: Query<User>) {
    return query.where({ name: 'Chalupas jr' })
  }

  @Deco.Scope({ default: true })
  public static hideDeleted(query: Query<User>) {
    return query.where({ deletedAt: null })
  }

  @Deco.BeforeSave()
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

const KG_PER_LB = 0.4536
const GRAMS_PER_POUND = 453.6

function lbsToGrams(lbs: number) {
  if (lbs === null) return lbs
  return round(lbs * KG_PER_LB * 1000)
}

function gramsToLbs(grams: number) {
  return round(grams / GRAMS_PER_POUND, 1)
}

function kilogramsToGrams(kilograms: number) {
  return round(kilograms * 1000)
}

function gramsToKilograms(grams: number) {
  return round(grams / 1000, 1)
}
