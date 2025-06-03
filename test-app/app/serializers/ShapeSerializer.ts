import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import Balloon from '../models/Balloon.js'
import Shape from '../models/Shape.js'

export const ShapeSummarySerializer = (shape: Shape) => DreamSerializer(Balloon, shape).attribute('id')

export const ShapeSerializer = (shape: Shape) => ShapeSummarySerializer(shape).attribute('type')
