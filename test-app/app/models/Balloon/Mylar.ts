import { BelongsTo, STI } from '../../../../src'
import Balloon from '../Balloon'
import User from '../User'

@STI(Balloon)
export default class Mylar extends Balloon {
  @BelongsTo(() => User)
  public user: User
}
