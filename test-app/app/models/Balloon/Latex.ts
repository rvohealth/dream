import { Decorators, DreamColumn } from '../../../../src'
import STI from '../../../../src/decorators/STI'
import { Type } from '../../../../src/dream/types'
import Balloon from '../Balloon'

const Decorator = new Decorators<Type<typeof Latex>>()

@STI(Balloon)
export default class Latex extends Balloon {
  @Decorator.Sortable({ scope: 'user' })
  public positionBeta: DreamColumn<Latex, 'positionBeta'>
}
