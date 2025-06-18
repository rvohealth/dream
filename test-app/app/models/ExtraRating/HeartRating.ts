import STI from '../../../../src/decorators/class/STI.js'
import { DreamSerializers } from '../../../../src/index.js'
import BaseExtraRating from './Base.js'

@STI(BaseExtraRating)
export default class HeartRating extends BaseExtraRating {
  public get serializers(): DreamSerializers<BaseExtraRating> {
    return {
      default: 'ExtraRating/HeartRatingSerializer',
    }
  }
}
