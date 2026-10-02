import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import Post from './Post.js'

const deco = new Decorators<typeof PostComment>()

@SoftDelete()
export default class PostComment extends ApplicationModel {
  public override get table() {
    return 'post_comments' as const
  }

  public id: DreamColumn<PostComment, 'id'>
  public body: DreamColumn<PostComment, 'body'>
  public deletedAt: DreamColumn<PostComment, 'deletedAt'>
  public createdAt: DreamColumn<PostComment, 'createdAt'>
  public updatedAt: DreamColumn<PostComment, 'updatedAt'>

  @deco.BelongsTo('Post')
  public post: Post
  public postId: DreamColumn<PostComment, 'postId'>

  @deco.BelongsTo('Post', { on: 'postId', withoutDefaultScopes: ['dream:SoftDelete'] })
  public postEvenIfDeleted: Post

  /**
   * Hooks that do nothing, for specs to spy on: destroying a comment fires
   * the after-destroy-commit hook, and undestroying one fires the
   * before-update and after-update-commit hooks.
   */
  @deco.AfterDestroyCommit()
  public afterDestroyCommitHook() {}

  @deco.BeforeUpdate()
  public beforeUpdateHook() {}

  @deco.AfterUpdateCommit()
  public afterUpdateCommitHook() {}
}
