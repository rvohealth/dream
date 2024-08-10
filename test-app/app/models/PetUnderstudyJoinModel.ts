import BelongsTo from '../../../src/decorators/associations/belongs-to'
import DreamSerializerConf from '../../../src/dream-serializer-conf'
import { DreamColumn } from '../../../src/dream/types'
import PetUnderstudyJoinModelSerializer from '../../../test-app/app/serializers/PetUnderstudyJoinModelSerializer'
import ApplicationModel from './ApplicationModel'
import Pet from './Pet'

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

DreamSerializerConf.add(PetUnderstudyJoinModel, { default: PetUnderstudyJoinModelSerializer<any> })
