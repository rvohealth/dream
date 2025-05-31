import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import BalloonSpotter from '../models/BalloonSpotter.js'

export default (data: BalloonSpotter) =>
  DreamSerializer(BalloonSpotter, data).rendersMany('balloons', { serializerKey: 'allBalloonStiChildren' })

// intentional bad association to make sure that our type generators
// don't crash upon reading
// new types prevent this
// .rendersOne('gobbledeegook' as any)
