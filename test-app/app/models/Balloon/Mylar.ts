import { DreamColumn } from '../../../../src'
import STI from '../../../../src/decorators/STI'
import Sortable from '../../../../src/decorators/sortable'
import Balloon from '../Balloon'
import Sandbag from '../Sandbag'
import User from '../User'

@STI(Balloon)
export default class Mylar extends Balloon {
  @Mylar.BelongsTo('User')
  public user: User

  @Mylar.HasMany('Sandbag', { foreignKey: 'balloonId' })
  public sandbags: Sandbag[]

  @Sortable({ scope: 'user' })
  public positionBeta: DreamColumn<Mylar, 'positionBeta'>
}
