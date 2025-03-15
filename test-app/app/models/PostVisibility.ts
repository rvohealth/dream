import { Decorators } from '../../../src.js'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types.js'
import ApplicationModel from './ApplicationModel.js'
import Post from './Post.js'

const Deco = new Decorators<InstanceType<typeof PostVisibility>>()

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

  @Deco.HasOne('Post', { dependent: 'destroy' })
  public post: Post

  @Deco.BeforeCreate()
  public conditionallyRaise() {
    if (this.notes === 'raise exception if notes set to this')
      throw new Error(
        `intentionally raising exception because PostVisibility#notes is set to '${this.notes}'`
      )
  }
}
