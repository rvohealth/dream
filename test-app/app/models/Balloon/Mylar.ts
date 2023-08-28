import STI from '../../../../src/decorators/STI'
import BelongsTo from '../../../../src/decorators/associations/belongs-to'
import HasMany from '../../../../src/decorators/associations/has-many'
import Balloon from '../Balloon'
import Sandbag from '../Sandbag'
import User from '../User'

@STI(Balloon)
export default class Mylar extends Balloon {
  @BelongsTo(() => User)
  public user: User

  @HasMany(() => Sandbag, { foreignKey: 'balloonId' })
  public sandbags: Sandbag[]
}
