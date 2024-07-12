import CannotCallUndestroyOnANonSoftDeleteModel from '../../../src/exceptions/cannot-call-undestroy-on-a-non-soft-delete-model'
import Post from '../../../test-app/app/models/Post'
import PostComment from '../../../test-app/app/models/PostComment'
import User from '../../../test-app/app/models/User'

describe('Dream#undestroy', () => {
  it('undestroys a soft-deleted record', async () => {
    const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
    const post = await Post.create({ user, body: 'hello world' })

    await post.destroy()

    expect(await Post.count()).toEqual(0)
    expect(await Post.removeAllDefaultScopes().count()).toEqual(1)

    const res = await post.undestroy()
    expect(res).toMatchDreamModel(post)
    expect(res.deletedAt).toBeNull()

    expect(await Post.all()).toMatchDreamModels([post])
  })

  context('without cascade: true passed', () => {
    it('undestroys child associations which are marked "dependent: `destroy`"', async () => {
      const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      const post = await Post.create({ user, body: 'hello world' })
      const comment = await PostComment.create({ post })

      await post.destroy()

      expect(await PostComment.count()).toEqual(0)
      expect(await PostComment.removeAllDefaultScopes().count()).toEqual(1)

      await post.undestroy()

      expect(await PostComment.all()).toMatchDreamModels([comment])
    })
  })

  context('with cascade: false passed', () => {
    it('does not undestroy child associations which are marked "dependent: `destroy`"', async () => {
      const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      const post = await Post.create({ user, body: 'hello world' })
      await PostComment.create({ post })

      await post.destroy()

      expect(await PostComment.count()).toEqual(0)
      expect(await PostComment.removeAllDefaultScopes().count()).toEqual(1)

      await post.undestroy({ cascade: false })

      expect(await PostComment.count()).toEqual(0)
      expect(await PostComment.removeAllDefaultScopes().count()).toEqual(1)
    })
  })

  context('the record is not a SoftDelete record', () => {
    it('raises an exception', async () => {
      const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      await expect(async () => await user.undestroy()).rejects.toThrow(
        CannotCallUndestroyOnANonSoftDeleteModel
      )
    })
  })
})
