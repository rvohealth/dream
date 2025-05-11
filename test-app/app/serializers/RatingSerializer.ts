import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import Rating from '../models/Rating.js'

export default (data: Rating) => DreamSerializer(Rating, data).attribute('id')
