import { DreamSerializer } from '../../../src/serializer/index.js'
import Balloon from '../models/Balloon.js'

export default (StiChildClass: typeof Balloon, data: Balloon) =>
  DreamSerializer(StiChildClass, data).attribute('color')
