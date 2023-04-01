import Dream from '../../..'
import { Column } from '../../../decorators/column'

export default class User extends Dream {
  @Column('howyadoin')
  public id?: number
}
