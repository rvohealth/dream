import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import Shape from '../models/Shape.js'

export const ShapeSummarySerializer = (shape: Shape) => DreamSerializer(Shape, shape).attribute('id')

export const ShapeSerializer = (shape: Shape) =>
  ShapeSummarySerializer(shape).attribute('name').attribute('type')
