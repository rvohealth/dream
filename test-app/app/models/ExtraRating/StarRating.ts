import STI from '../../../../src/decorators/class/STI.js'
import { DreamSerializers } from '../../../../src/types/dream.js'
import BaseExtraRating from './Base.js'

@STI(BaseExtraRating)
export default class StarRating extends BaseExtraRating {
  public get serializers(): DreamSerializers<BaseExtraRating> {
    return {
      default: 'ExtraRating/StarRatingSerializer',
    }
  }
}
