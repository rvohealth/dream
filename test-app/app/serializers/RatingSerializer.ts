import { DreamModelSerializer } from '../../../src/serializer/index.js'
import Rating from '../models/Rating.js'

const RatingSerializer = ($data: Rating) => DreamModelSerializer(Rating, $data).attribute('id')

export default RatingSerializer
