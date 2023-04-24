import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { Column } from '../../../src/decorators/column'
import dream from '../../../src/dream'
import Composition from './composition'
import Post from './post'
import User from './user'

const Dream = dream('ratings')
export default class Rating extends Dream {
  @Column('number')
  public id: number

  @Column('number')
  public user_id: number

  @Column('number')
  public rateable_id: number

  @Column('string')
  public body: string | null

  @BelongsTo(() => User)
  public user: User

  @BelongsTo(() => [Composition, Post], {
    foreignKey: 'rateable_id',
    polymorphic: true,
  })
  public rateable: Rating
}
