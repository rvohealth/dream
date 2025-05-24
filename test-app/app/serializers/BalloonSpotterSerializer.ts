import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import BalloonSpotter from '../models/BalloonSpotter.js'

const BalloonSpotterSerializer = (data: BalloonSpotter) =>
  DreamSerializer(BalloonSpotter, data)
    .attribute('name')
    .rendersMany('balloons', { serializerKey: 'allBalloonStiChildren' })

export default BalloonSpotterSerializer
