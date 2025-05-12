import { DreamModelSerializer } from '../../../src/serializer/index.js'
import BalloonSpotter from '../models/BalloonSpotter.js'

const BalloonSpotterSerializer = ($data: BalloonSpotter) =>
  DreamModelSerializer(BalloonSpotter, $data)
    .attribute('name')
    .rendersMany('balloons', { serializerKey: 'summary' })

export default BalloonSpotterSerializer
