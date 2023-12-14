import { DateTime } from 'luxon'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import HasOne from '../../../src/decorators/associations/has-one'
import Scope from '../../../src/decorators/scope'
import User from './User'
import { IdType } from '../../../src/dream/types'
import { BeforeDestroy } from '../../../src'
import Collar from './Collar'
import PetSerializer from '../serializers/PetSerializer'
import { CatTreats, Species } from '../../db/schema'
import ApplicationModel from './ApplicationModel'

export default class Pet extends ApplicationModel {
  public get table() {
    return 'pets' as const
  }

  public get serializer() {
    return PetSerializer
  }

  public id: IdType
  public species: Species
  public name: string
  public favoriteTreats: CatTreats[]
  public deletedAt: DateTime
  public createdAt: DateTime

  @Scope({ default: true })
  public static hideDeleted(query: any) {
    return query.where({ deletedAt: null })
  }

  @BelongsTo(() => User, {
    optional: true,
  })
  public user: User | null
  public userId: IdType

  @HasMany(() => Collar)
  public collars: Collar

  @HasOne(() => Collar, { where: { lost: false } })
  public currentCollar: Collar

  // begin: totally contrived for testing purposes
  @HasOne(() => Collar, { whereNot: { lost: true } })
  public notLostCollar: Collar

  @HasMany(() => Collar, { distinct: 'tagName' })
  public uniqueCollars: Collar
  // end: totally contrived for testing purposes

  @BeforeDestroy()
  public async doSoftDelete() {
    await (this as Pet).update({ deletedAt: DateTime.now() })
    this.preventDeletion()
  }
}
