import { DreamSerializer } from '../../../src/serializer/index.js'
import PetUnderstudyJoinModel from '../models/PetUnderstudyJoinModel.js'

const PetUnderstudyJoinModelSerializer = ($data: PetUnderstudyJoinModel) =>
  DreamSerializer(PetUnderstudyJoinModel, $data).rendersOne('pet').rendersOne('understudy')

export default PetUnderstudyJoinModelSerializer
