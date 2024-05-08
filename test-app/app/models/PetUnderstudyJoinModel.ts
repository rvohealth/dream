import { DateTime } from 'luxon'
import { IdType } from '../../../src/dream/types'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import PetUnderstudyJoinModelSerializer from '../../../test-app/app/serializers/PetUnderstudyJoinModelSerializer'
import Pet from './Pet'
import ApplicationModel from './ApplicationModel'

export default class PetUnderstudyJoinModel extends ApplicationModel {
  public get table() {
    return 'pet_understudy_join_models' as const
  }

  public get serializers() {
    return { default: PetUnderstudyJoinModelSerializer<any> } as const
  }

  public id: IdType
  public createdAt: DateTime
  public updatedAt: DateTime

  @BelongsTo(() => Pet)
  public pet: Pet
  public petId: IdType

  @BelongsTo(() => Pet, { foreignKey: 'understudyId' })
  public understudy: Pet
  public understudyId: IdType
}
