import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import PetUnderstudyJoinModel from '../models/PetUnderstudyJoinModel.js'

export default (data: PetUnderstudyJoinModel) =>
  DreamSerializer(PetUnderstudyJoinModel, data).rendersOne('pet').rendersOne('understudy')
