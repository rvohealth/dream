import Post from '../../../test-app/app/models/Post'
import PostComment from '../../../test-app/app/models/PostComment'
import User from '../../../test-app/app/models/User'

describe('Query#removeAllDefaultScopes', () => {
  let user: User
  let post: Post
  let postComment: PostComment

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    post = await Post.create({ user })
    postComment = await PostComment.create({ post, body: 'hello world' })
  })

  it('circumvents default scopes to provide otherwise-hidden records, including on associations', async () => {
    await post.destroy()

    const reloadedPost = await Post.query()
      .removeAllDefaultScopes()
      .preload('comments')
      .findOrFailBy({ id: post.id })
    expect(reloadedPost).toMatchDreamModel(post)
    expect(reloadedPost.comments).toMatchDreamModels([postComment])

    const pluckedThrough = await Post.query()
      .removeAllDefaultScopes()
      .innerJoin('comments')
      .pluck('comments.body')
    expect(pluckedThrough).toEqual(['hello world'])
  })
})
