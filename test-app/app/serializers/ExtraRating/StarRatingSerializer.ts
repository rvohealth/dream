import StarRating from '../../models/ExtraRating/StarRating.js'
import { BaseExtraRatingSerializer } from './BaseExtraRatingSerializer.js'

export const StarRatingSerializer = (data: StarRating) =>
  BaseExtraRatingSerializer(StarRating, data).attribute('id').attribute('type')
