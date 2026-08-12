import BatchingIncompatibleWithLimitOrOffset from '../../../src/errors/BatchingIncompatibleWithLimitOrOffset.js'
import CannotCallUndestroyOnANonSoftDeleteModel from '../../../src/errors/CannotCallUndestroyOnANonSoftDeleteModel.js'
import Post from '../../../test-app/app/models/Post.js'
import PostComment from '../../../test-app/app/models/PostComment.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#undestroy', () => {
  it('undestroys a soft-deleted record', async () => {
    const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
    const post1 = await Post.create({ user, body: 'hello world' })
    const post2 = await Post.create({ user, body: 'hello world' })
    const post3 = await Post.create({ user, body: 'goodbye world' })

    await Post.where({ body: 'hello world' }).destroy()

    expect(await Post.count()).toEqual(1)
    expect(await Post.first()).toMatchDreamModel(post3)

    const res = await Post.where({ body: 'hello world' }).undestroy()
    expect(res).toEqual(2)

    expect(await Post.all()).toMatchDreamModels([post1, post2, post3])
  })

  context('without cascade passed', () => {
    it('undestroys child associations which are marked "dependent: `destroy`"', async () => {
      const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      const post = await Post.create({ user, body: 'hello world' })
      const comment = await PostComment.create({ post })

      await post.destroy()

      expect(await PostComment.count()).toEqual(0)
      expect(await PostComment.removeAllDefaultScopes().count()).toEqual(1)

      await Post.query().undestroy()

      expect(await PostComment.all()).toMatchDreamModels([comment])
    })
  })

  context('with cascade=false passed', () => {
    it('does not undestroy child associations which are marked "dependent: `destroy`"', async () => {
      const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      const post = await Post.create({ user, body: 'hello world' })
      await PostComment.create({ post })

      await post.destroy()

      expect(await PostComment.count()).toEqual(0)
      expect(await PostComment.removeAllDefaultScopes().count()).toEqual(1)

      await Post.query().undestroy({ cascade: false })

      expect(await PostComment.count()).toEqual(0)
      expect(await PostComment.removeAllDefaultScopes().count()).toEqual(1)
    })
  })

  context('when the Query carries a limit or offset', () => {
    it('rejects them rather than corrupting the batch windows', async () => {
      // the batch windows re-apply the Query's conditions per batch, so a
      // carried limit would be silently replaced by the batch size and a
      // carried offset re-applied to every window
      const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      await Post.create({ user, body: 'hello world' })
      await Post.create({ user, body: 'hello world' })
      await Post.where({ body: 'hello world' }).destroy()

      await expect(Post.query().limit(1).undestroy()).rejects.toThrow(BatchingIncompatibleWithLimitOrOffset)
      await expect(Post.query().offset(1).undestroy()).rejects.toThrow(BatchingIncompatibleWithLimitOrOffset)

      expect(await Post.count()).toEqual(0)
    })
  })

  context('the record is not a SoftDelete record', () => {
    it('raises an exception', async () => {
      await expect(async () => await User.query().undestroy()).rejects.toThrow(
        CannotCallUndestroyOnANonSoftDeleteModel
      )
    })
  })
})
