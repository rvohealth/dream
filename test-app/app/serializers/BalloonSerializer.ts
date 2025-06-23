import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import Balloon from '../models/Balloon.js'

export default <T extends Balloon>(StiChildClass: typeof Balloon, data: T) =>
  DreamSerializer(StiChildClass ?? Balloon, data).attribute('color')
