import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import BalloonLine from '../models/BalloonLine.js'

export default (data: BalloonLine) =>
  DreamSerializer(BalloonLine, data).rendersOne('balloon').attribute('material').attribute('createdAt')
