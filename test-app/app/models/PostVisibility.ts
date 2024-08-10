import HasOne from '../../../src/decorators/associations/has-one'
import BeforeCreate from '../../../src/decorators/hooks/before-create'
import DreamSerializerConf from '../../../src/dream-serializer-conf'
import { DreamColumn } from '../../../src/dream/types'
import { PostVisibilitySerializer } from '../serializers/PostVisibilitySerializer'
import ApplicationModel from './ApplicationModel'
import Post from './Post'

export default class PostVisibility extends ApplicationModel {
  public get table() {
    return 'post_visibilities' as const
  }

  public id: DreamColumn<PostVisibility, 'id'>
  public visibility: DreamColumn<PostVisibility, 'visibility'>
  public notes: DreamColumn<PostVisibility, 'notes'>
  public createdAt: DreamColumn<PostVisibility, 'createdAt'>
  public updatedAt: DreamColumn<PostVisibility, 'updatedAt'>

  @HasOne(() => Post, { dependent: 'destroy' })
  public post: Post

  @BeforeCreate()
  public conditionallyRaise() {
    if (this.notes === 'raise exception if notes set to this')
      throw `intentionally raising exception because PostVisibility#notes is set to '${this.notes}'`
  }
}

DreamSerializerConf.add(PostVisibility, { default: PostVisibilitySerializer<any> })
