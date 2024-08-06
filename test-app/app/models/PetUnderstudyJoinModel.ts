import { DreamColumn } from '../../../src/dream/types'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import PetUnderstudyJoinModelSerializer from '../../../test-app/app/serializers/PetUnderstudyJoinModelSerializer'
import Pet from './Pet'
import ApplicationModel from './ApplicationModel'

export default class PetUnderstudyJoinModel extends ApplicationModel {
  public get table() {
    return 'pet_understudy_join_models' as const
  }

  public id: DreamColumn<PetUnderstudyJoinModel, 'id'>
  public createdAt: DreamColumn<PetUnderstudyJoinModel, 'createdAt'>
  public updatedAt: DreamColumn<PetUnderstudyJoinModel, 'updatedAt'>

  @BelongsTo(() => Pet)
  public pet: Pet
  public petId: DreamColumn<PetUnderstudyJoinModel, 'petId'>

  @BelongsTo(() => Pet, { foreignKey: 'understudyId' })
  public understudy: Pet
  public understudyId: DreamColumn<PetUnderstudyJoinModel, 'understudyId'>
}

PetUnderstudyJoinModel.register('serializers', { default: PetUnderstudyJoinModelSerializer<any> })
