import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import { Column } from '../../../src/decorators/column'
import Dream from '../../../src/dream'
import dream from '../../../src/dream'
import Rating from './rating'
import User from './user'

export default class Post extends Dream {
  public static get table() {
    return 'posts' as const
  }

  @Column('number')
  public id: number

  @Column('number')
  public user_id: number

  @Column('string')
  public body: string | null

  @BelongsTo(() => User)
  public user: User

  @HasMany(() => Rating, {
    foreignKey: 'rateable_id',
    polymorphic: true,
  })
  public ratings: Rating[]
}
