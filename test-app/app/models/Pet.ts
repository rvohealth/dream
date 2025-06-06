import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import { Decorators, ops } from '../../../src/index.js'
import { DreamColumn, IdType } from '../../../src/types/dream.js'
import PetSerializer, { PetSummarySerializer } from '../serializers/PetSerializer.js'
import ApplicationModel from './ApplicationModel.js'
import Balloon from './Balloon.js'
import Collar from './Collar.js'
import PetUnderstudyJoinModel from './PetUnderstudyJoinModel.js'
import Post from './Post.js'
import Rating from './Rating.js'
import User from './User.js'

const deco = new Decorators<typeof Pet>()

@SoftDelete()
export default class Pet extends ApplicationModel {
  public override get table() {
    return 'pets' as const
  }

  public get serializers() {
    return {
      default: PetSerializer,
      summary: PetSummarySerializer,
    }
  }

  public id: DreamColumn<Pet, 'id'>
  public species: DreamColumn<Pet, 'species'>
  public name: DreamColumn<Pet, 'name'>
  public favoriteTreats: DreamColumn<Pet, 'favoriteTreats'>
  public deletedAt: DreamColumn<Pet, 'deletedAt'>
  public createdAt: DreamColumn<Pet, 'createdAt'>

  public get nickname() {
    return ((this as Pet).getAttribute('nickname') || this.name) as NonNullable<typeof this.name>
  }

  public set nickname(nickname: string) {
    ;(this as Pet).setAttribute('nickname', `Li’l ${nickname}`)
  }

  @deco.Sortable({ scope: 'species' })
  public positionWithinSpecies: number

  @deco.BelongsTo(() => User, {
    optional: true,
    primaryKeyOverride: 'uuid',
    foreignKey: 'userUuid',
  })
  public userThroughUuid: User | null
  public userUuid: string

  @deco.BelongsTo(() => User, {
    optional: true,
  })
  public user: User | null
  public userId: IdType

  @deco.HasOne('Post', { through: 'user' })
  public featuredPost: Post

  @deco.HasMany('Rating', { through: 'user' })
  public ratings: Rating[]

  @deco.HasMany('Rating', { through: 'user' })
  public featuredRatings: Rating[]

  @deco.HasMany('Collar', { dependent: 'destroy' })
  public collars: Collar[]

  @deco.HasOne('Collar', { and: { lost: false } })
  public currentCollar: Collar

  // begin: totally contrived for testing purposes
  @deco.HasOne('Collar', { andNot: { lost: true } })
  public notLostCollar: Collar

  @deco.HasMany('Collar', { distinct: 'tagName' })
  public uniqueCollars: Collar

  @deco.HasMany('Balloon', { through: 'uniqueCollars', source: 'balloon' })
  public uniqueBalloons: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', distinct: true })
  public distinctBalloons: Balloon

  // on
  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', and: { color: null } })
  public and_null: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', and: { color: ops.equal(null) } })
  public and_opsEqual_null: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', and: { color: ops.not.equal(null) } })
  public and_opsNotEqual_null: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', and: { color: 'red' } })
  public and_red: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', and: { color: ops.equal('red') } })
  public and_opsEqual_red: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    and: { color: ops.not.equal('red') },
  })
  public and_opsNotEqual_red: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', and: { color: ['red'] } })
  public and_redArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', and: { color: ops.in(['red']) } })
  public and_opsIn_redArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', and: { color: ops.not.in(['red']) } })
  public and_opsNotIn_redArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', and: { color: [] } })
  public and_emptyArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', and: { color: ops.in([]) } })
  public and_opsIn_emptyArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', and: { color: ops.not.in([]) } })
  public and_opsNotIn_emptyArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', and: { color: [null as any] } })
  public and_arrayWithNull: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', and: { color: ops.in([null]) } })
  public and_opsIn_arrayWithNull: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', and: { color: ops.not.in([null]) } })
  public and_opsNotIn_arrayWithNull: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    and: { color: [null as any, 'red'] },
  })
  public and_arrayWithNullAndRed: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    and: { color: ops.in([null, 'red']) },
  })
  public and_opsIn_arrayWithNullAndRed: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    and: { color: ops.not.in([null, 'red']) },
  })
  public and_opsNotIn_arrayWithNullAndRed: Balloon
  // end: on

  // andNot
  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', andNot: { color: null } })
  public andNot_null: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', andNot: { color: ops.equal(null) } })
  public andNot_opsEqual_null: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andNot: { color: ops.not.equal(null) },
  })
  public andNot_opsNotEqual_null: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', andNot: { color: 'red' } })
  public andNot_red: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andNot: { color: 'red', type: 'Latex' },
  })
  public andNot_multipleClauses: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', andNot: { color: ops.equal('red') } })
  public andNot_opsEqual_red: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andNot: { color: ops.not.equal('red') },
  })
  public andNot_opsNotEqual_red: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', andNot: { color: ['red'] } })
  public andNot_redArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', andNot: { color: ops.in(['red']) } })
  public andNot_opsIn_redArray: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andNot: { color: ops.not.in(['red']) },
  })
  public andNot_opsNotIn_redArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', andNot: { color: [] } })
  public andNot_emptyArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', andNot: { color: ops.in([]) } })
  public andNot_opsIn_emptyArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', andNot: { color: ops.not.in([]) } })
  public andNot_opsNotIn_emptyArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', andNot: { color: [null as any] } })
  public andNot_arrayWithNull: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', andNot: { color: ops.in([null]) } })
  public andNot_opsIn_arrayWithNull: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andNot: { color: ops.not.in([null]) },
  })
  public andNot_opsNotIn_arrayWithNull: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andNot: { color: [null as any, 'red'] },
  })
  public andNot_arrayWithNullAndRed: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andNot: { color: ops.in([null, 'red']) },
  })
  public andNot_opsIn_arrayWithNullAndRed: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andNot: { color: ops.not.in([null, 'red']) },
  })
  public andNot_opsNotIn_arrayWithNullAndRed: Balloon

  // end: andNot

  // andAny
  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: null }, { positionAlpha: null }],
  })
  public andAny_null: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: ops.equal(null) }, { positionAlpha: null }],
  })
  public andAny_opsEqual_null: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: ops.not.equal(null) }, { positionAlpha: null }],
  })
  public andAny_opsNotEqual_null: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: 'red' }, { positionAlpha: null }],
  })
  public andAny_red: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: ops.equal('red') }, { positionAlpha: null }],
  })
  public andAny_opsEqual_red: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: ops.not.equal('red') }, { positionAlpha: null }],
  })
  public andAny_opsNotEqual_red: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: ['red'] }, { positionAlpha: null }],
  })
  public andAny_redArray: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: ops.in(['red']) }, { positionAlpha: null }],
  })
  public andAny_opsIn_redArray: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: ops.not.in(['red']) }, { positionAlpha: null }],
  })
  public andAny_opsNotIn_redArray: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: [] }, { positionAlpha: null }],
  })
  public andAny_emptyArray: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: ops.in([]) }, { positionAlpha: null }],
  })
  public andAny_opsIn_emptyArray: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: ops.not.in([]) }, { positionAlpha: null }],
  })
  public andAny_opsNotIn_emptyArray: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: [null as any] }, { positionAlpha: null }],
  })
  public andAny_arrayWithNull: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: ops.in([null]) }, { positionAlpha: null }],
  })
  public andAny_opsIn_arrayWithNull: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: ops.not.in([null]) }, { positionAlpha: null }],
  })
  public andAny_opsNotIn_arrayWithNull: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: [null as any, 'red'] }, { positionAlpha: null }],
  })
  public andAny_arrayWithNullAndRed: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: ops.in([null, 'red']) }, { positionAlpha: null }],
  })
  public andAny_opsIn_arrayWithNullAndRed: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    andAny: [{ color: ops.not.in([null, 'red']) }, { positionAlpha: null }],
  })
  public andAny_opsNotIn_arrayWithNullAndRed: Balloon
  // end: andAny

  @deco.HasMany('PetUnderstudyJoinModel', { foreignKey: 'petId' })
  public petUnderstudies: PetUnderstudyJoinModel[]

  @deco.HasMany('Pet', {
    through: 'petUnderstudies',
    source: 'understudy',
    distinct: true,
  })
  public understudies: Pet[]
  // end: totally contrived for testing purposes

  @deco.BeforeUpdate()
  public markRecordUpdated() {
    if (this.name === 'change me') {
      this.name = 'changed by update hook'
    }
  }

  @deco.BeforeCreate()
  public markRecordCreated() {
    if (this.name === 'change me') {
      this.name = 'changed by create hook'
    }
  }
}
