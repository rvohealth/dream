import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import { Decorators, ops } from '../../../src/index.js'
import { DreamColumn, DreamSerializers, IdType } from '../../../src/types/dream.js'
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

  public get serializers(): DreamSerializers<Pet> {
    return {
      default: 'PetSerializer',
      summary: 'PetSummarySerializer',
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

  @deco.BelongsTo('User', {
    optional: true,
    primaryKeyOverride: 'uuid',
    foreignKey: 'userUuid',
  })
  public userThroughUuid: User | null
  public userUuid: string

  @deco.BelongsTo('User', {
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

  @deco.HasOne('Collar', { on: { lost: false } })
  public currentCollar: Collar

  // begin: totally contrived for testing purposes
  @deco.HasOne('Collar', { notOn: { lost: true } })
  public notLostCollar: Collar

  @deco.HasMany('Collar', { distinct: 'tagName' })
  public uniqueCollars: Collar

  @deco.HasMany('Balloon', { through: 'uniqueCollars', source: 'balloon' })
  public uniqueBalloons: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', distinct: true })
  public distinctBalloons: Balloon

  // on
  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: null } })
  public where_null: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.equal(null) } })
  public where_opsEqual_null: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.not.equal(null) } })
  public where_opsNotEqual_null: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: 'red' } })
  public where_red: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.equal('red') } })
  public where_opsEqual_red: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    on: { color: ops.not.equal('red') },
  })
  public where_opsNotEqual_red: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ['red'] } })
  public where_redArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.in(['red']) } })
  public where_opsIn_redArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.not.in(['red']) } })
  public where_opsNotIn_redArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: [] } })
  public where_emptyArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.in([]) } })
  public where_opsIn_emptyArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.not.in([]) } })
  public where_opsNotIn_emptyArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: [null as any] } })
  public where_arrayWithNull: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.in([null]) } })
  public where_opsIn_arrayWithNull: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.not.in([null]) } })
  public where_opsNotIn_arrayWithNull: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    on: { color: [null as any, 'red'] },
  })
  public where_arrayWithNullAndRed: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    on: { color: ops.in([null, 'red']) },
  })
  public where_opsIn_arrayWithNullAndRed: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    on: { color: ops.not.in([null, 'red']) },
  })
  public where_opsNotIn_arrayWithNullAndRed: Balloon
  // end: on

  // notOn
  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: null } })
  public whereNot_null: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: ops.equal(null) } })
  public whereNot_opsEqual_null: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    notOn: { color: ops.not.equal(null) },
  })
  public whereNot_opsNotEqual_null: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: 'red' } })
  public whereNot_red: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    notOn: { color: 'red', type: 'Latex' },
  })
  public whereNot_multipleClauses: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: ops.equal('red') } })
  public whereNot_opsEqual_red: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    notOn: { color: ops.not.equal('red') },
  })
  public whereNot_opsNotEqual_red: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: ['red'] } })
  public whereNot_redArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: ops.in(['red']) } })
  public whereNot_opsIn_redArray: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    notOn: { color: ops.not.in(['red']) },
  })
  public whereNot_opsNotIn_redArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: [] } })
  public whereNot_emptyArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: ops.in([]) } })
  public whereNot_opsIn_emptyArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: ops.not.in([]) } })
  public whereNot_opsNotIn_emptyArray: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: [null as any] } })
  public whereNot_arrayWithNull: Balloon

  @deco.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: ops.in([null]) } })
  public whereNot_opsIn_arrayWithNull: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    notOn: { color: ops.not.in([null]) },
  })
  public whereNot_opsNotIn_arrayWithNull: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    notOn: { color: [null as any, 'red'] },
  })
  public whereNot_arrayWithNullAndRed: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    notOn: { color: ops.in([null, 'red']) },
  })
  public whereNot_opsIn_arrayWithNullAndRed: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    notOn: { color: ops.not.in([null, 'red']) },
  })
  public whereNot_opsNotIn_arrayWithNullAndRed: Balloon

  // end: notOn

  // onAny
  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: null }, { positionAlpha: null }],
  })
  public onAny_null: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.equal(null) }, { positionAlpha: null }],
  })
  public onAny_opsEqual_null: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.not.equal(null) }, { positionAlpha: null }],
  })
  public onAny_opsNotEqual_null: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: 'red' }, { positionAlpha: null }],
  })
  public onAny_red: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.equal('red') }, { positionAlpha: null }],
  })
  public onAny_opsEqual_red: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.not.equal('red') }, { positionAlpha: null }],
  })
  public onAny_opsNotEqual_red: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ['red'] }, { positionAlpha: null }],
  })
  public onAny_redArray: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.in(['red']) }, { positionAlpha: null }],
  })
  public onAny_opsIn_redArray: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.not.in(['red']) }, { positionAlpha: null }],
  })
  public onAny_opsNotIn_redArray: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: [] }, { positionAlpha: null }],
  })
  public onAny_emptyArray: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.in([]) }, { positionAlpha: null }],
  })
  public onAny_opsIn_emptyArray: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.not.in([]) }, { positionAlpha: null }],
  })
  public onAny_opsNotIn_emptyArray: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: [null as any] }, { positionAlpha: null }],
  })
  public onAny_arrayWithNull: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.in([null]) }, { positionAlpha: null }],
  })
  public onAny_opsIn_arrayWithNull: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.not.in([null]) }, { positionAlpha: null }],
  })
  public onAny_opsNotIn_arrayWithNull: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: [null as any, 'red'] }, { positionAlpha: null }],
  })
  public onAny_arrayWithNullAndRed: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.in([null, 'red']) }, { positionAlpha: null }],
  })
  public onAny_opsIn_arrayWithNullAndRed: Balloon

  @deco.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.not.in([null, 'red']) }, { positionAlpha: null }],
  })
  public onAny_opsNotIn_arrayWithNullAndRed: Balloon
  // end: onAny

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
}
