import { Decorators, ops } from '../../../src'
import SoftDelete from '../../../src/decorators/SoftDelete'
import Sortable from '../../../src/decorators/sortable/Sortable'
import { DreamColumn, DreamSerializers, IdType, Type } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Balloon from './Balloon'
import Collar from './Collar'
import PetUnderstudyJoinModel from './PetUnderstudyJoinModel'
import Post from './Post'
import Rating from './Rating'
import User from './User'

const Decorator = new Decorators<Type<typeof Pet>>()

@SoftDelete()
export default class Pet extends ApplicationModel {
  public get table() {
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

  @Sortable({ scope: 'species' })
  public positionWithinSpecies: number

  @Sortable()
  public unscopedPosition: number

  @Decorator.BelongsTo('User', {
    optional: true,
    primaryKeyOverride: 'uuid',
    foreignKey: 'userUuid',
  })
  public userThroughUuid: User | null
  public userUuid: string

  @Decorator.BelongsTo('User', {
    optional: true,
  })
  public user: User | null
  public userId: IdType

  @Decorator.HasOne('Post', { through: 'user' })
  public featuredPost: Post

  @Decorator.HasMany('Rating', { through: 'user' })
  public ratings: Rating[]

  @Decorator.HasMany('Rating', { through: 'user' })
  public featuredRatings: Rating[]

  @Decorator.HasMany('Collar', { dependent: 'destroy' })
  public collars: Collar[]

  @Decorator.HasOne('Collar', { on: { lost: false } })
  public currentCollar: Collar

  // begin: totally contrived for testing purposes
  @Decorator.HasOne('Collar', { notOn: { lost: true } })
  public notLostCollar: Collar

  @Decorator.HasMany('Collar', { distinct: 'tagName' })
  public uniqueCollars: Collar

  @Decorator.HasMany('Balloon', { through: 'uniqueCollars', source: 'balloon' })
  public uniqueBalloons: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', distinct: true })
  public distinctBalloons: Balloon

  // on
  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: null } })
  public where_null: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.equal(null) } })
  public where_opsEqual_null: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.not.equal(null) } })
  public where_opsNotEqual_null: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: 'red' } })
  public where_red: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.equal('red') } })
  public where_opsEqual_red: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    on: { color: ops.not.equal('red') },
  })
  public where_opsNotEqual_red: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ['red'] } })
  public where_redArray: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.in(['red']) } })
  public where_opsIn_redArray: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.not.in(['red']) } })
  public where_opsNotIn_redArray: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: [] } })
  public where_emptyArray: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.in([]) } })
  public where_opsIn_emptyArray: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.not.in([]) } })
  public where_opsNotIn_emptyArray: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: [null as any] } })
  public where_arrayWithNull: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.in([null]) } })
  public where_opsIn_arrayWithNull: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', on: { color: ops.not.in([null]) } })
  public where_opsNotIn_arrayWithNull: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    on: { color: [null as any, 'red'] },
  })
  public where_arrayWithNullAndRed: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    on: { color: ops.in([null, 'red']) },
  })
  public where_opsIn_arrayWithNullAndRed: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    on: { color: ops.not.in([null, 'red']) },
  })
  public where_opsNotIn_arrayWithNullAndRed: Balloon
  // end: on

  // notOn
  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: null } })
  public whereNot_null: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: ops.equal(null) } })
  public whereNot_opsEqual_null: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    notOn: { color: ops.not.equal(null) },
  })
  public whereNot_opsNotEqual_null: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: 'red' } })
  public whereNot_red: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    notOn: { color: 'red', type: 'Latex' },
  })
  public whereNot_multipleClauses: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: ops.equal('red') } })
  public whereNot_opsEqual_red: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    notOn: { color: ops.not.equal('red') },
  })
  public whereNot_opsNotEqual_red: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: ['red'] } })
  public whereNot_redArray: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: ops.in(['red']) } })
  public whereNot_opsIn_redArray: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    notOn: { color: ops.not.in(['red']) },
  })
  public whereNot_opsNotIn_redArray: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: [] } })
  public whereNot_emptyArray: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: ops.in([]) } })
  public whereNot_opsIn_emptyArray: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: ops.not.in([]) } })
  public whereNot_opsNotIn_emptyArray: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: [null as any] } })
  public whereNot_arrayWithNull: Balloon

  @Decorator.HasMany('Balloon', { through: 'collars', source: 'balloon', notOn: { color: ops.in([null]) } })
  public whereNot_opsIn_arrayWithNull: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    notOn: { color: ops.not.in([null]) },
  })
  public whereNot_opsNotIn_arrayWithNull: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    notOn: { color: [null as any, 'red'] },
  })
  public whereNot_arrayWithNullAndRed: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    notOn: { color: ops.in([null, 'red']) },
  })
  public whereNot_opsIn_arrayWithNullAndRed: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    notOn: { color: ops.not.in([null, 'red']) },
  })
  public whereNot_opsNotIn_arrayWithNullAndRed: Balloon

  // end: notOn

  // onAny
  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: null }, { positionAlpha: null }],
  })
  public onAny_null: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.equal(null) }, { positionAlpha: null }],
  })
  public onAny_opsEqual_null: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.not.equal(null) }, { positionAlpha: null }],
  })
  public onAny_opsNotEqual_null: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: 'red' }, { positionAlpha: null }],
  })
  public onAny_red: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.equal('red') }, { positionAlpha: null }],
  })
  public onAny_opsEqual_red: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.not.equal('red') }, { positionAlpha: null }],
  })
  public onAny_opsNotEqual_red: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ['red'] }, { positionAlpha: null }],
  })
  public onAny_redArray: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.in(['red']) }, { positionAlpha: null }],
  })
  public onAny_opsIn_redArray: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.not.in(['red']) }, { positionAlpha: null }],
  })
  public onAny_opsNotIn_redArray: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: [] }, { positionAlpha: null }],
  })
  public onAny_emptyArray: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.in([]) }, { positionAlpha: null }],
  })
  public onAny_opsIn_emptyArray: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.not.in([]) }, { positionAlpha: null }],
  })
  public onAny_opsNotIn_emptyArray: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: [null as any] }, { positionAlpha: null }],
  })
  public onAny_arrayWithNull: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.in([null]) }, { positionAlpha: null }],
  })
  public onAny_opsIn_arrayWithNull: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.not.in([null]) }, { positionAlpha: null }],
  })
  public onAny_opsNotIn_arrayWithNull: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: [null as any, 'red'] }, { positionAlpha: null }],
  })
  public onAny_arrayWithNullAndRed: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.in([null, 'red']) }, { positionAlpha: null }],
  })
  public onAny_opsIn_arrayWithNullAndRed: Balloon

  @Decorator.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    onAny: [{ color: ops.not.in([null, 'red']) }, { positionAlpha: null }],
  })
  public onAny_opsNotIn_arrayWithNullAndRed: Balloon
  // end: onAny

  @Decorator.HasMany('PetUnderstudyJoinModel', { foreignKey: 'petId' })
  public petUnderstudies: PetUnderstudyJoinModel[]

  @Decorator.HasMany('Pet', {
    through: 'petUnderstudies',
    source: 'understudy',
    distinct: true,
  })
  public understudies: Pet[]
  // end: totally contrived for testing purposes

  @Decorator.BeforeUpdate()
  public markRecordUpdated() {
    if (this.name === 'change me') {
      this.name = 'changed by update hook'
    }
  }
}
