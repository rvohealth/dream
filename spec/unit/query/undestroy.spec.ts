import CannotCallUndestroyOnANonSoftDeleteModel from '../../../src/exceptions/CannotCallUndestroyOnANonSoftDeleteModel'
import Post from '../../../test-app/app/models/Post'
import PostComment from '../../../test-app/app/models/PostComment'
import User from '../../../test-app/app/models/User'

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

  context('the record is not a SoftDelete record', () => {
    it('raises an exception', async () => {
      await expect(async () => await User.query().undestroy()).rejects.toThrow(
        CannotCallUndestroyOnANonSoftDeleteModel
      )
    })
  })
})
