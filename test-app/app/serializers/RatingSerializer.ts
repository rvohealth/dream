import { DreamSerializer } from '../../../src/serializer/index.js'
import Rating from '../models/Rating.js'

const RatingSerializer = ($data: Rating) => DreamSerializer(Rating, $data).attribute('id')

export default RatingSerializer
