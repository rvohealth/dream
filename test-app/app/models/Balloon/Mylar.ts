import STI from '../../../../src/decorators/STI'
import HasMany from '../../../../src/decorators/associations/has-many'
import Balloon from '../Balloon'
import Sortable from '../../../../src/decorators/sortable'
import BelongsTo from '../../../../src/decorators/associations/belongs-to'
import User from '../User'
import Sandbag from '../Sandbag'
import { DreamColumn } from '../../../../src'

@STI(() => Balloon)
export default class Mylar extends Balloon {
  @BelongsTo(() => User)
  public user: User

  @HasMany(() => Sandbag, { foreignKey: 'balloonId' })
  public sandbags: Sandbag[]

  @Sortable({ scope: 'user' })
  public positionBeta: DreamColumn<Mylar, 'positionBeta'>
}
