import { DreamSerializer } from '../../../src/serializer/index.js'
import Balloon from '../models/Balloon.js'

export default ($data: Balloon) => DreamSerializer(Balloon, $data).attribute('color')
