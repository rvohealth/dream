import RendersOne from '../../../src/serializer/decorators/associations/renders-one'
import DreamSerializer from '../../../src/serializer'
import PetUnderstudyJoinModel from '../models/PetUnderstudyJoinModel'
import Pet from '../models/Pet'

export default class PetUnderstudyJoinModelSerializer<
  DataType extends PetUnderstudyJoinModel
> extends DreamSerializer<DataType> {
  @RendersOne()
  public pet: Pet

  @RendersOne()
  public understudy: Pet
}
