import BeforeCreate from '../../../src/decorators/hooks/before-create'
import HasOne from '../../../src/decorators/associations/has-one'
import { DreamColumn } from '../../../src/dream/types'
import Post from './Post'
import ApplicationModel from './ApplicationModel'
import { PostVisibilitySerializer } from '../serializers/PostVisibilitySerializer'

export default class PostVisibility extends ApplicationModel {
  public get table() {
    return 'post_visibilities' as const
  }

  public get serializers() {
    return { default: PostVisibilitySerializer<any> } as const
  }

  public id: DreamColumn<PostVisibility, 'id'>
  public visibility: DreamColumn<PostVisibility, 'visibility'>
  public notes: DreamColumn<PostVisibility, 'notes'>
  public createdAt: DreamColumn<PostVisibility, 'createdAt'>
  public updatedAt: DreamColumn<PostVisibility, 'updatedAt'>

  @HasOne(() => Post)
  public post: Post

  @BeforeCreate()
  public conditionallyRaise() {
    if (this.notes === 'raise exception if notes set to this')
      throw `intentionally raising exception because PostVisibility#notes is set to '${this.notes}'`
  }
}
