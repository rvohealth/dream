import RendersOne from '../../../src/serializer/decorators/associations/RendersOne.js'
import DreamSerializer from '../../../src/serializer/index.js'
import Pet from '../models/Pet.js'
import PetUnderstudyJoinModel from '../models/PetUnderstudyJoinModel.js'

export default class PetUnderstudyJoinModelSerializer<
  DataType extends PetUnderstudyJoinModel,
> extends DreamSerializer<DataType> {
  @RendersOne()
  public pet: Pet

  @RendersOne()
  public understudy: Pet
}
