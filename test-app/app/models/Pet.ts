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

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: 'red' } })
  public redBalloons: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: ops.not.equal('red') } })
  public redBalloonsNegated: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: ['red'] } })
  public redBalloonsWithArrayWhere: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: ops.not.in(['red']) } })
  public redBalloonsWithArrayWhereNegated: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: [] } })
  public redBalloonsWithEmptyArrayWhere: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', where: { color: ops.not.in([]) } })
  public redBalloonsWithEmptyArrayWhereNegated: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: 'red' } })
  public notRedBalloons: Balloon

  @Pet.HasMany('Balloon', {
    through: 'collars',
    source: 'balloon',
    whereNot: { color: ops.not.equal('red') },
  })
  public notRedBalloonsNegated: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: ['red'] } })
  public notRedBalloonsWithArrayWhereNot: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: ops.not.in(['red']) } })
  public notRedBalloonsWithArrayWhereNotNegated: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: [] } })
  public notRedBalloonsWithEmptyArrayWhereNot: Balloon

  @Pet.HasMany('Balloon', { through: 'collars', source: 'balloon', whereNot: { color: ops.not.in([]) } })
  public notRedBalloonsWithEmptyArrayWhereNotNegated: Balloon

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
