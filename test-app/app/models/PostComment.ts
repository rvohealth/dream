import { Decorators } from '../../../src'
import SoftDelete from '../../../src/decorators/SoftDelete'
import { DreamColumn, Type } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Post from './Post'

const Decorator = new Decorators<Type<typeof PostComment>>()

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

  @Decorator.BelongsTo('Post')
  public post: Post
  public postId: DreamColumn<PostComment, 'postId'>

  @Decorator.BelongsTo('Post', { foreignKey: 'postId', withoutDefaultScopes: ['dream:SoftDelete'] })
  public postEvenIfDeleted: Post
}
