import STI from '../../../../src/decorators/STI'
import Balloon from '../Balloon'
import Sortable from '../../../../src/decorators/sortable'
import { DreamColumn } from '../../../../src'

@STI(Balloon)
export default class Latex extends Balloon {
  @Sortable({ scope: 'user' })
  public positionBeta: DreamColumn<Latex, 'positionBeta'>
}
