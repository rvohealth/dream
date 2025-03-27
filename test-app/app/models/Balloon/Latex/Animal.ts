import STI from '../../../../../src/decorators/class/STI.js'
import { BalloonTypesEnum } from '../../../../types/db.js'
import Latex from '../Latex.js'

@STI(Latex)
export default class Animal extends Latex {
  public override get type() {
    return (this as Animal).getAttribute('type')
  }

  public override set type(newType: BalloonTypesEnum) {
    ;(this as Animal).setAttribute('type', 'Animal')
  }
}
