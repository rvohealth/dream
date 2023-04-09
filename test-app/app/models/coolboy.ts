import { dream, Column, BelongsTo } from 'dream'
import User from './user'

const Dream = dream('coolboys')
export default class Coolboy extends dream {
  @Column('number')
  public id: number

  @Column('string')
  public email: string

  @Column('string')
  public password: string

  @Column('number)
  public userId: number

  @BelongsTo(() => User)
  public user: User

  @Column('datetime')
  public createdAt: Date

  @Column('datetime')
  public updatedAt: Date
}