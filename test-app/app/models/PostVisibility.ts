import { Decorators } from '../../../src'
import BeforeCreate from '../../../src/decorators/hooks/BeforeCreate'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Post from './Post'

const Decorator = new Decorators<PostVisibility>()

export default class PostVisibility extends ApplicationModel {
  public get table() {
    return 'post_visibilities' as const
  }

  public get serializers(): DreamSerializers<PostVisibility> {
    return { default: 'PostVisibilitySerializer' }
  }

  public id: DreamColumn<PostVisibility, 'id'>
  public visibility: DreamColumn<PostVisibility, 'visibility'>
  public notes: DreamColumn<PostVisibility, 'notes'>
  public createdAt: DreamColumn<PostVisibility, 'createdAt'>
  public updatedAt: DreamColumn<PostVisibility, 'updatedAt'>

  @Decorator.HasOne('Post', { dependent: 'destroy' })
  public post: Post

  @BeforeCreate()
  public conditionallyRaise() {
    if (this.notes === 'raise exception if notes set to this')
      throw new Error(
        `intentionally raising exception because PostVisibility#notes is set to '${this.notes}'`
      )
  }
}
