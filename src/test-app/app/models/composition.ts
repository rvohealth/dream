import { Column } from '../../../decorators/column'
import dream from '../../../dream'

export default class Composition extends dream('compositions') {
  @Column('number')
  public id: number
}
