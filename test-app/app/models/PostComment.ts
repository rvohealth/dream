import { Decorators } from '../../../src.js'
import SoftDelete from '../../../src/decorators/SoftDelete.js'
import { DreamColumn } from '../../../src/dream/types.js'
import ApplicationModel from './ApplicationModel.js'
import Post from './Post.js'

const Deco = new Decorators<InstanceType<typeof PostComment>>()

@SoftDelete()
export default class PostComment extends ApplicationModel {
  public get table() {
    return 'post_comments' as const
  }

  public id: DreamColumn<PostComment, 'id'>
  public body: DreamColumn<PostComment, 'body'>
  public deletedAt: DreamColumn<PostComment, 'deletedAt'>
  public createdAt: DreamColumn<PostComment, 'createdAt'>
  public updatedAt: DreamColumn<PostComment, 'updatedAt'>

  @Deco.BelongsTo('Post')
  public post: Post
  public postId: DreamColumn<PostComment, 'postId'>

  @Deco.BelongsTo('Post', { foreignKey: 'postId', withoutDefaultScopes: ['dream:SoftDelete'] })
  public postEvenIfDeleted: Post
}
