import { DreamModelSerializer } from '../../../src/serializer/index.js'
import BalloonLine from '../models/BalloonLine.js'

const BalloonLineSerializer = ($data: BalloonLine) =>
  DreamModelSerializer(BalloonLine, $data).attribute('balloon').attribute('material').attribute('createdAt')

export default BalloonLineSerializer
