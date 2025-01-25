import { BeforeUpdate, ops } from '../../../src'
import SoftDelete from '../../../src/decorators/SoftDelete'
import Sortable from '../../../src/decorators/sortable/Sortable'
import { DreamColumn, DreamSerializers, IdType } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Balloon from './Balloon'
import Collar from './Collar'
import PetUnderstudyJoinModel from './PetUnderstudyJoinModel'
import Post from './Post'
import Rating from './Rating'
import User from './User'

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

  @Pet.BelongsTo('User', {
    optional: true,
    primaryKeyOverride: 'uuid',
    foreignKey: 'userUuid',
  })
  public userThroughUuid: User | null
  public userUuid: string

  @Pet.BelongsTo('User', {
    optional: true,
  })
  public user: User | null
  public userId: IdType

  @Pet.HasOne('Post', { through: 'user' })
  public featuredPost: Post

  @Pet.HasMany('Rating', { through: 'user' })
  public ratings: Rating[]

  @Pet.HasMany('Rating', { through: 'user' })
  public featuredRatings: Rating[]

  @Pet.HasMany('Collar', { dependent: 'destroy' })
  public collars: Collar

  @Pet.HasOne('Collar', { where: { lost: false } })
  public currentCollar: Collar

  // begin: totally contrived for testing purposes
  @Pet.HasOne('Collar', { whereNot: { lost: true } })
  public notLostCollar: Collar

  @Pet.HasMany('Collar', { distinct: 'tagName' })
  public uniqueCollars: Collar

  @Pet.HasMany('Balloon', { through: 'uniqueCollars', source: 'balloon' })
  public uniqueBalloons: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', distinct: true })
  public distinctBalloons: Balloon

  // where
  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: null } })
  public where_null: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: ops.equal(null) } })
  public where_opsEqual_null: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: ops.not.equal(null) } })
  public where_opsNotEqual_null: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: 'red' } })
  public where_red: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: ops.equal('red') } })
  public where_opsEqual_red: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: ops.not.equal('red') } })
  public where_opsNotEqual_red: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: ['red'] } })
  public where_redArray: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: ops.in(['red']) } })
  public where_opsIn_redArray: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: ops.not.in(['red']) } })
  public where_opsNotIn_redArray: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: [] } })
  public where_emptyArray: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: ops.in([]) } })
  public where_opsIn_emptyArray: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: ops.not.in([]) } })
  public where_opsNotIn_emptyArray: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: [null as any] } })
  public where_arrayWithNull: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: ops.in([null]) } })
  public where_opsIn_arrayWithNull: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: ops.not.in([null]) } })
  public where_opsNotIn_arrayWithNull: Balloon
  // end: where

  // whereNot
  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: null } })
  public whereNot_null: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: ops.equal(null) } })
  public whereNot_opsEqual_null: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: ops.not.equal(null) } })
  public whereNot_opsNotEqual_null: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: 'red' } })
  public whereNot_red: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: ops.equal('red') } })
  public whereNot_opsEqual_red: Balloon

  @Pet.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    whereNot: { color: ops.not.equal('red') },
  })
  public whereNot_opsNotEqual_red: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: ['red'] } })
  public whereNot_redArray: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: ops.in(['red']) } })
  public whereNot_opsIn_redArray: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: ops.not.in(['red']) } })
  public whereNot_opsNotIn_redArray: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: [] } })
  public whereNot_emptyArray: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: ops.in([]) } })
  public whereNot_opsIn_emptyArray: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: ops.not.in([]) } })
  public whereNot_opsNotIn_emptyArray: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: [null as any] } })
  public whereNot_arrayWithNull: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: ops.in([null]) } })
  public whereNot_opsIn_arrayWithNull: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: ops.not.in([null]) } })
  public whereNot_opsNotIn_arrayWithNull: Balloon
  // end: whereNot

  @Pet.HasMany('PetUnderstudyJoinModel', { foreignKey: 'petId' })
  public petUnderstudies: PetUnderstudyJoinModel[]

  @Pet.HasMany('Pet', {
    through: 'petUnderstudies',
    source: 'understudy',
    distinct: true,
  })
  public understudies: Pet[]
  // end: totally contrived for testing purposes

  @BeforeUpdate()
  public markRecordUpdated() {
    if (this.name === 'change me') {
      this.name = 'changed by update hook'
    }
  }
}
