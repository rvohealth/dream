import BelongsTo from '../../../associations/belongs-to'
import { Column } from '../../../decorators/column'
import dream from '../../../dream'
import User from './user'

const { Dream } = dream('compositions')
export default class Composition extends Dream {
  @Column('number')
  public id: number

  @Column('number')
  public user_id: number

  @BelongsTo('users', () => User)
  public user: User
}
