import STI from '../../../../src/decorators/class/STI.js'
import { DreamSerializers } from '../../../../src/types/dream.js'
import Balloon from '../Balloon.js'

@STI(() => Balloon)
export default class Mylar extends Balloon {
  public get serializers(): DreamSerializers<Balloon> {
    return {
      default: 'Balloon/MylarSerializer',
      mylarOnly: 'Balloon/MylarSerializer',
      allBalloonStiChildren: 'BalloonSummarySerializer',
    }
  }
}
