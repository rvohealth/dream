import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import Balloon from '../models/Balloon.js'

export default (data: Balloon) => DreamSerializer(Balloon, data).attribute('color')
