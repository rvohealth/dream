import { BeforeUpdate } from '../../../src'
import HasMany from '../../../src/decorators/associations/has-many'
import HasOne from '../../../src/decorators/associations/has-one'
import SoftDelete from '../../../src/decorators/soft-delete'
import Sortable from '../../../src/decorators/sortable'
import { DreamColumn, IdType } from '../../../src/dream/types'
import PetSerializer, { PetSummarySerializer } from '../serializers/PetSerializer'
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

  @Pet.BelongsTo(() => User, {
    optional: true,
    primaryKeyOverride: 'uuid',
    foreignKey: 'userUuid',
  })
  public userThroughUuid: User | null
  public userUuid: string

  @Pet.BelongsTo(() => User, {
    optional: true,
  })
  public user: User | null
  public userId: IdType

  @Pet.HasOne(() => Post, { through: 'user' })
  public featuredPost: Post

  @HasMany(() => Rating, { through: 'user' })
  public ratings: Rating[]

  @Pet.HasMany(() => Rating, { through: 'user' })
  public featuredRatings: Rating[]

  @HasMany(() => Collar, { dependent: 'destroy' })
  public collars: Collar

  @HasOne(() => Collar, { where: { lost: false } })
  public currentCollar: Collar

  // begin: totally contrived for testing purposes
  @HasOne(() => Collar, { whereNot: { lost: true } })
  public notLostCollar: Collar

  @HasMany(() => Collar, { distinct: 'tagName' })
  public uniqueCollars: Collar

  @Pet.HasMany(() => Balloon, { through: 'uniqueCollars', source: 'balloon' })
  public uniqueBalloons: Balloon

  @HasMany(() => Balloon, { through: 'collars', source: 'balloon', distinct: true })
  public distinctBalloons: Balloon

  @HasMany(() => Balloon, { through: 'collars', source: 'balloon', where: { color: 'red' } })
  public redBalloons: Balloon

  @HasMany(() => Balloon, { through: 'collars', source: 'balloon', whereNot: { color: 'red' } })
  public notRedBalloons: Balloon

  @HasMany(() => PetUnderstudyJoinModel, { foreignKey: 'petId' })
  public petUnderstudies: PetUnderstudyJoinModel[]

  @Pet.HasMany(() => Pet, {
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

void new Promise<void>(accept => accept())
  .then(() =>
    Pet.register('serializers', {
      default: PetSerializer<any, any>,
      summary: PetSummarySerializer<any, any>,
    })
  )
  .catch()
