import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import BaseExtraRating from '../../models/ExtraRating/Base.js'

export const BaseExtraRatingSerializer = <T extends BaseExtraRating>(
  StiChildClass: typeof BaseExtraRating,
  data: T
) => DreamSerializer(StiChildClass, data).attribute('id').attribute('type')
