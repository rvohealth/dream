import { DreamSerializer } from '../../../src/serializer/index.js'
import Collar from '../models/Collar.js'

const CollarSerializer = ($data: Collar) =>
  DreamSerializer(Collar, $data).attribute('id').attribute('lost').rendersOne('pet')

export default CollarSerializer
