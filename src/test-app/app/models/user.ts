import { Column } from '../../../decorators/column'
import dream from '../../../dream'

export default class User extends dream('users') {
  @Column('number')
  public id: number

  @Column('string')
  public email: string

  @Column('string')
  public name: string

  @Column('string')
  public password: string
}
