import { DreamColumn } from '../../../../src'
import Sortable from '../../../../src/decorators/sortable/Sortable'
import STI from '../../../../src/decorators/STI'
import Balloon from '../Balloon'

@STI(Balloon)
export default class Latex extends Balloon {
  @Sortable({ scope: 'user' })
  public positionBeta: DreamColumn<Latex, 'positionBeta'>
}
