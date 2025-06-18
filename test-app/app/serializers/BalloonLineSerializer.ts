import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import BalloonLine from '../models/BalloonLine.js'

export const BallonLineSummarySerializer = (data: BalloonLine) =>
  DreamSerializer(BalloonLine, data).attribute('material')

export default (data: BalloonLine) =>
  DreamSerializer(BalloonLine, data).rendersOne('balloon').attribute('material').attribute('createdAt')
