import HeartRating from '../../models/ExtraRating/HeartRating.js'
import { BaseExtraRatingSerializer } from './BaseExtraRatingSerializer.js'

export const HeartRatingSerializer = (data: HeartRating) => BaseExtraRatingSerializer(HeartRating, data)
