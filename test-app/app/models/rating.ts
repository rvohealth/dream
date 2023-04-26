import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { Column } from '../../../src/decorators/column'
import Dream from '../../../src/dream'
import Composition from './composition'
import Post from './post'
import User from './user'

export default class Rating extends Dream {
  public static get table() {
    return 'ratings' as const
  }

  @Column('number')
  public id: number

  @Column('number')
  public user_id: number

  @Column('number')
  public rateable_id: number

  @Column('string')
  public rateable_type: number

  @Column('string')
  public body: string | null

  @BelongsTo(() => User)
  public user: User

  @BelongsTo(() => [Composition, Post], {
    foreignKey: 'rateable_id',
    polymorphic: true,
  })
  public rateable: Composition | Post
}
