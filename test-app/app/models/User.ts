import { randomBytes, scrypt, timingSafeEqual } from 'crypto'
import Decorators from '../../../src/decorators/Decorators.js'
import { DreamConst } from '../../../src/dream/constants.js'
import Query from '../../../src/dream/Query.js'
import { DateTime } from '../../../src/helpers/DateTime.js'
import range from '../../../src/helpers/range.js'
import round from '../../../src/helpers/round.js'
import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
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

const deco = new Decorators<typeof User>()

export default class User extends ApplicationModel {
  public override get table() {
    return 'users' as const
  }

  public get serializers(): DreamSerializers<User> {
    return {
      default: 'UserSerializer',
      summary: 'UserSummarySerializer',
      deep: 'UserDeepSerializer',
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

  @deco.Encrypted()
  public secret: DreamColumn<User, 'encryptedSecret'>

  @deco.Encrypted('myOtherEncryptedSecret')
  public otherSecret: { token: string } | null

  @deco.Virtual('string')
  public password: string | undefined
  public passwordDigest: DreamColumn<User, 'passwordDigest'>

  @deco.Virtual('string')
  public randoVirtual: string

  @deco.Virtual('number')
  public get lbs() {
    const self: User = this
    return gramsToLbs(self.getAttribute('grams') ?? 0)
  }

  public set lbs(lbs: number) {
    const self: User = this
    self.setAttribute('grams', lbsToGrams(lbs))
  }

  @deco.Virtual(['number', 'null'])
  public set kilograms(kg: number) {
    const self: User = this
    self.setAttribute('grams', kilogramsToGrams(kg))
  }

  public get kilograms() {
    const self: User = this
    return gramsToKilograms(self.getAttribute('grams') ?? 0)
  }

  @deco.Validates('contains', '@')
  @deco.Validates('presence')
  @deco.Validates('length', { min: 4, max: 64 })
  public email: DreamColumn<User, 'email'>

  @deco.HasOne('UserSettings')
  public userSettings: UserSettings

  @deco.HasMany('Post')
  // @deco.HasMany('Post', { dependent: 'destroy' })
  public posts: Post[]

  @deco.HasMany('Post', { withoutDefaultScopes: ['dream:SoftDelete'] })
  public allPosts: Post[]

  @deco.HasMany('Post', { order: 'position' })
  public orderedPosts: Post[]

  @deco.HasMany('PostComment', { through: 'posts', source: 'comments' })
  public postComments: PostComment[]

  @deco.HasMany('PostComment', {
    through: 'allPosts',
    source: 'allComments',
  })
  public allPostComments: PostComment[]

  @deco.HasMany('Rating')
  public ratings: Rating[]

  @deco.HasMany('ExtraRating/HeartRating')
  public heartRatings: HeartRating[]

  @deco.HasMany('Rating', { through: 'posts', source: 'ratings' })
  public postRatings: Rating[]

  @deco.HasOne('Post', { selfAnd: { position: 'featuredPostPosition' } })
  public featuredPost: Post

  @deco.HasMany('Rating', { through: 'featuredPost', source: 'ratings' })
  public featuredRatings: Rating[]

  @deco.HasMany('Rating', {
    through: 'posts',
    source: 'ratings',
    selfAnd: { rating: 'targetRating' },
  })
  public ratingsThroughPostsThatMatchUserTargetRating: Rating[]

  @deco.HasMany('Composition', { dependent: 'destroy' })
  public compositions: Composition[]

  @deco.HasOne('Composition', {
    and: { primary: true },
  })
  public mainComposition: Composition

  @deco.HasMany('IncompatibleForeignKeyTypeExample')
  public incompatibleForeignKeyTypeExamples: IncompatibleForeignKeyTypeExample[]

  @deco.HasMany('CompositionAsset', {
    through: 'compositions',
  })
  public compositionAssets: CompositionAsset[]

  @deco.HasOne('CompositionAsset', {
    through: 'mainComposition',
  })
  public mainCompositionAsset: CompositionAsset

  @deco.HasMany('Composition', {
    order: { id: 'desc' },
  })
  public reverseOrderedCompositions: Composition[]

  @deco.HasMany('Composition', {
    order: { content: 'asc', id: 'desc' },
  })
  public sortedCompositions: Composition[]

  @deco.HasMany('Composition', {
    order: {
      content: 'asc',
      id: 'desc',
    },
  })
  public sortedCompositions2: Composition[]

  @deco.HasMany('CompositionAssetAudit', {
    through: 'compositionAssets',
  })
  public compositionAssetAudits: CompositionAssetAudit[]

  // recent associations
  @deco.HasMany('Composition', {
    and: { createdAt: () => range(DateTime.now().minus({ week: 1 })) },
  })
  public recentCompositions: Composition[]

  // not recent associations (contrived so that we can test whereNot)
  @deco.HasMany('Composition', {
    andNot: { createdAt: () => range(DateTime.now().minus({ week: 1 })) },
  })
  public notRecentCompositions: Composition[]

  @deco.HasMany('CompositionAsset', {
    through: 'recentCompositions',
    source: 'compositionAssets',
  })
  public recentCompositionAssets: CompositionAsset[]

  @deco.HasMany('CompositionAsset', {
    through: 'recentCompositions',
    source: 'mainCompositionAsset',
  })
  public recentMainCompositionAssets: CompositionAsset[]

  // end:recent associations

  // missing through association
  @deco.HasMany('CompositionAsset', { through: 'nonExtantCompositions' as any })
  public nonExtantCompositionAssets1: CompositionAsset[]
  // end: missing through association

  // missing through association source
  @deco.HasMany('CompositionAsset', { through: 'compositions' })
  public nonExtantCompositionAssets2: CompositionAsset[]
  // end: missing through association source

  @deco.HasMany('Balloon')
  public balloons: Balloon[]

  @deco.HasMany('BalloonLine', { through: 'balloons', source: 'balloonLine' })
  public balloonLines: BalloonLine[]

  @deco.HasMany('Pet')
  public pets: Pet[]

  // allows us to find hidden pets
  @deco.HasMany('Pet', {
    withoutDefaultScopes: ['dream:SoftDelete'],
  })
  public allPets: Pet[]

  @deco.HasMany('Pet', { on: 'userUuid', primaryKeyOverride: 'uuid' })
  public petsFromUuid: Pet[]

  @deco.HasOne('Pet', { on: 'userUuid', primaryKeyOverride: 'uuid' })
  public firstPetFromUuid: Pet

  @deco.HasOne('Pet', { and: { name: 'Aster' } })
  public asterPet: Pet

  @deco.HasMany('Pet', { and: { name: DreamConst.passthrough } })
  public petsWithPassthroughName: Pet[]

  @deco.HasMany('Pet', { and: { name: DreamConst.required } })
  public petsWithRequiredName: Pet[]

  @deco.HasMany('Collar', { through: 'petsFromUuid', source: 'collars' })
  public collarsFromUuid: Collar[]

  @deco.HasOne('Collar', { through: 'firstPetFromUuid', source: 'collars' })
  public firstCollarFromUuid: Collar[]

  @deco.HasMany('Balloon', { through: 'collarsFromUuid', source: 'balloon' })
  public balloonsFromUuid: Collar[]

  @deco.Scope()
  public static withFunnyName(query: Query<User>) {
    return query.where({ name: 'Chalupas jr' })
  }

  @deco.Scope({ default: true })
  public static hideDeleted(query: Query<User>) {
    return query.where({ deletedAt: null })
  }

  @deco.BeforeSave()
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
    const hashKeyBuff = Buffer.from(hashKey!, 'hex')

    scrypt(password, salt!, keyLength, (err, derivedKey) => {
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
