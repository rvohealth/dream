import STI from '../../../../src/decorators/class/STI.js'
import BaseExtraRating from './Base.js'

@STI(() => BaseExtraRating)
export default class HeartRating extends BaseExtraRating {}
