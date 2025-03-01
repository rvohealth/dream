import { Decorators, DreamColumn } from '../../../../src'
import STI from '../../../../src/decorators/STI'
import Balloon from '../Balloon'

const Decorator = new Decorators<Latex>()

@STI(Balloon)
export default class Latex extends Balloon {
  @Decorator.Sortable({ scope: 'user' })
  public positionBeta: DreamColumn<Latex, 'positionBeta'>
}
