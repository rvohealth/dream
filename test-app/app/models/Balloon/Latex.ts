import { STI, Sortable } from '../../../../src'
import Balloon from '../Balloon'

@STI(Balloon)
export default class Latex extends Balloon {
  @Sortable({ scope: 'user' })
  public positionBeta: number
}
