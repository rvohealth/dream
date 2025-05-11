import STI from '../../../../../src/decorators/class/STI.js'
import { DreamSerializers } from '../../../../../src/types/dream.js'
import { BalloonTypesEnum } from '../../../../types/db.js'
import Balloon from '../../Balloon.js'
import Latex from '../Latex.js'

@STI(Balloon)
export default class Animal extends Latex {
  public override get type() {
    return (this as Animal).getAttribute('type')
  }

  public override set type(newType: BalloonTypesEnum) {
    ;(this as Animal).setAttribute('type', 'Animal')
  }

  public override get serializers(): DreamSerializers<Latex> {
    return {
      default: 'Balloon/Latex/AnimalSerializer',
      allBalloonStiChildren: 'BalloonSummarySerializer',
    }
  }
}
