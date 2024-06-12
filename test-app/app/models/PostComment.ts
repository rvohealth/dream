import { DreamColumn, BelongsTo, SoftDelete } from '../../../src'
import ApplicationModel from './ApplicationModel'
import Post from './Post'

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

  @BelongsTo(() => Post)
  public post: Post
  public postId: DreamColumn<PostComment, 'postId'>
}
