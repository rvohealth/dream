import { Column } from '../../../decorators/column'
import dream from '../../../dream'

const { Dream } = dream('compositions')
export default class Composition extends Dream {
  @Column('number')
  public id: number

  @Column('number')
  public user_id: number
}
