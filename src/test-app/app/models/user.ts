import { Column } from '../../../decorators/column'
import dream from '../../../dream'
import Composition from './composition'

const { Dream, HasMany, HasOne } = dream('users')
export default class User extends Dream {
  @Column('number')
  public id: number

  @Column('string')
  public email: string

  @Column('string')
  public name: string

  @Column('string')
  public password: string

  @HasMany('compositions', () => Composition)
  public compositions: Composition[]

  @HasOne('compositions', () => Composition)
  public mainComposition: Composition
}
