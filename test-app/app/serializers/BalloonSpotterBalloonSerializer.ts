import { DreamModelSerializer } from '../../../src/serializer/index.js'
import BalloonSpotter from '../models/BalloonSpotter.js'

const BalloonSpotterBalloonSerializer = ($data: BalloonSpotter) =>
  DreamModelSerializer(BalloonSpotter, $data)
    .rendersMany('balloons', { serializerKey: 'summary' })

    // intentional bad association to make sure that our type generators
    // don't crash upon reading
    .rendersOne('gobbledeegook' as any)

export default BalloonSpotterBalloonSerializer
