import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import { Column } from '../../../src/decorators/column'
import dream from '../../../src/dream'
import Rating from './rating'
import User from './user'

const Dream = dream('posts')
export default class Post extends Dream {
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
