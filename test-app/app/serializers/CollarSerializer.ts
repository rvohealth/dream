import { DreamModelSerializer } from '../../../src/serializer/index.js'
import Collar from '../models/Collar.js'

const CollarSerializer = ($data: Collar) =>
  DreamModelSerializer(Collar, $data).attribute('id').attribute('lost').rendersOne('pet')

export default CollarSerializer
