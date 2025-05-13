import { DreamSerializer } from '../../../src/serializer/index.js'
import Balloon from '../models/Balloon.js'

const BalloonSummarySerializer = ($data: Balloon) => DreamSerializer(Balloon, $data).attribute('color')

export default BalloonSummarySerializer
