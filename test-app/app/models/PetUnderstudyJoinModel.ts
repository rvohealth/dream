import { Decorators } from '../../../src/index.js'
import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import Pet from './Pet.js'

const Deco = new Decorators<InstanceType<typeof PetUnderstudyJoinModel>>()

export default class PetUnderstudyJoinModel extends ApplicationModel {
  public get table() {
    return 'pet_understudy_join_models' as const
  }

  public get serializers(): DreamSerializers<PetUnderstudyJoinModel> {
    return { default: 'PetUnderstudyJoinModelSerializer' }
  }

  public id: DreamColumn<PetUnderstudyJoinModel, 'id'>
  public createdAt: DreamColumn<PetUnderstudyJoinModel, 'createdAt'>
  public updatedAt: DreamColumn<PetUnderstudyJoinModel, 'updatedAt'>

  @Deco.BelongsTo('Pet')
  public pet: Pet
  public petId: DreamColumn<PetUnderstudyJoinModel, 'petId'>

  @Deco.BelongsTo('Pet', { foreignKey: 'understudyId' })
  public understudy: Pet
  public understudyId: DreamColumn<PetUnderstudyJoinModel, 'understudyId'>
}
