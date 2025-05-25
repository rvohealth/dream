import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import Collar from '../models/Collar.js'

export default (data: Collar) =>
  DreamSerializer(Collar, data).attribute('id').attribute('lost').rendersOne('pet')
