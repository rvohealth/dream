import BelongsTo from '../../../associations/belongs-to'
import { Column } from '../../../decorators/column'
import dream from '../../../dream'
import User from './user'

const { Dream } = dream('composition_assets')
export default class CompositionAsset extends Dream {
  @Column('number')
  public id: number

  @Column('number')
  public composition_id: number

  @BelongsTo('users', () => User)
  public user: User
}
