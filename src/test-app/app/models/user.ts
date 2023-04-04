import { Column } from '../../../decorators/column'
import dream from '../../../dream'

const { Dream } = dream('users')
export default class User extends Dream {
  @Column('number')
  public id: number

  @Column('string')
  public email: string

  @Column('string')
  public name: string

  @Column('string')
  public password: string
}
