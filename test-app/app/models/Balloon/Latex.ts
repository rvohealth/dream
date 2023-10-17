import STI from '../../../../src/decorators/STI'
import Balloon from '../Balloon'
import Sortable from '../../../../src/decorators/sortable'

@STI(Balloon)
export default class Latex extends Balloon {
  @Sortable({ scope: 'user' })
  public positionBeta: number
}
