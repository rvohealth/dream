import DreamSerializer from '../../../src/serializer'
import RendersOne from '../../../src/serializer/decorators/associations/RendersOne'
import Pet from '../models/Pet'
import PetUnderstudyJoinModel from '../models/PetUnderstudyJoinModel'

export default class PetUnderstudyJoinModelSerializer<
  DataType extends PetUnderstudyJoinModel,
> extends DreamSerializer<DataType> {
  @RendersOne()
  public pet: Pet

  @RendersOne()
  public understudy: Pet
}
