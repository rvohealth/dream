import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import Dream from '../../../src/dream'
import Rating from './rating'
import User from './user'

export default class Post extends Dream {
  public get table() {
    return 'posts' as const
  }

  public id: number
  public body: string | null

  @BelongsTo(() => User)
  public user: User
  public user_id: number

  @HasMany(() => Rating, {
    foreignKey: 'rateable_id',
    polymorphic: true,
  })
  public ratings: Rating[]
}
