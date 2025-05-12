import { DreamModelSerializer } from '../../../src/serializer/index.js'
import Balloon from '../models/Balloon.js'

const BalloonSummarySerializer = ($data: Balloon) => DreamModelSerializer(Balloon, $data).attribute('color')

export default BalloonSummarySerializer
