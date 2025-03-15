import Post from '../../../test-app/app/models/Post.js'
import PostComment from '../../../test-app/app/models/PostComment.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#removeAllDefaultScopesExceptOnAssociations', () => {
  let user: User
  let post: Post

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    post = await Post.create({ user })
    await PostComment.create({ post, body: 'hello world' })
  })

  it('removes default scopes from the base model, but not when joining', async () => {
    await post.destroy()

    const reloadedPost = await Post.query()
      ['removeAllDefaultScopesExceptOnAssociations']()
      .preload('comments')
      .findOrFailBy({ id: post.id })
    expect(reloadedPost).toMatchDreamModel(post)
    expect(reloadedPost.comments).toHaveLength(0)

    const pluckedThrough = await Post.query()
      ['removeAllDefaultScopesExceptOnAssociations']()
      .innerJoin('comments')
      .pluck('comments.body')
    expect(pluckedThrough).toHaveLength(0)
  })
})
