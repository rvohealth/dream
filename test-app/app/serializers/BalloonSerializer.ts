import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import Balloon from '../models/Balloon.js'

export default (StiChildClass: typeof Balloon, data: Balloon) =>
  DreamSerializer(StiChildClass, data).attribute('color')
