import { DreamSerializer } from '../../../src/serializer/index.js'
import BalloonLine from '../models/BalloonLine.js'

const BalloonLineSerializer = ($data: BalloonLine) =>
  DreamSerializer(BalloonLine, $data).attribute('balloon').attribute('material').attribute('createdAt')

export default BalloonLineSerializer
