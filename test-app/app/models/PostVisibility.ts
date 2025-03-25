import { Decorators } from '../../../src/index.js'
import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import Post from './Post.js'

const deco = new Decorators<InstanceType<typeof PostVisibility>>()

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

  @deco.HasOne('Post', { dependent: 'destroy' })
  public post: Post

  @deco.BeforeCreate()
  public conditionallyRaise() {
    if (this.notes === 'raise exception if notes set to this')
      throw new Error(
        `intentionally raising exception because PostVisibility#notes is set to '${this.notes}'`
      )
  }
}
