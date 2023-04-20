import { HasOne } from '../../../src'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import { Column } from '../../../src/decorators/column'
import AfterCreate from '../../../src/decorators/hooks/after-create'
import AfterSave from '../../../src/decorators/hooks/after-save'
import AfterUpdate from '../../../src/decorators/hooks/after-update'
import BeforeCreate from '../../../src/decorators/hooks/before-create'
import dream from '../../../src/dream'
import CompositionAsset from './composition-asset'
import CompositionAssetAudit from './composition-asset-audit'
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

  @BelongsTo('users', () => User)
  public user: User

  @HasMany('ratings', () => Rating, {
    foreignKey: 'rateable_id',
    polymorphic: true,
  })
  public ratings: Rating[]
}
