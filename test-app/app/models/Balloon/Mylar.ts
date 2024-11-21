import { DreamColumn } from '../../../../src'
import STI from '../../../../src/decorators/STI'
import Sortable from '../../../../src/decorators/sortable/Sortable'
import Balloon from '../Balloon'

@STI(Balloon)
export default class Mylar extends Balloon {
  @Sortable({ scope: 'user' })
  public positionBeta: DreamColumn<Mylar, 'positionBeta'>
}
