import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import HeartRating from '../../../test-app/app/models/ExtraRating/HeartRating.js'
import Post from '../../../test-app/app/models/Post.js'
import PostComment from '../../../test-app/app/models/PostComment.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.leftJoin', () => {
  it('joins a HasOne association, including models that don’t have an associated model', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    await Composition.create({ userId: user2.id, primary: true })

    const reloadedUsers = await User.leftJoin('mainComposition').all()
    expect(reloadedUsers).toMatchDreamModels([user1, user2])
  })

  context('when encased in a transaction', () => {
    it('joins a HasOne association, including models that don’t have an associated model', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      await Composition.create({ userId: user2.id, primary: true })
      let reloadedUsers: User[]

      await ApplicationModel.transaction(async txn => {
        reloadedUsers = await User.txn(txn).leftJoin('mainComposition').all()
        expect(reloadedUsers).toMatchDreamModels([user1, user2])
      })
    })
  })

  context('with an association provided as an argument to the and clause', () => {
    it('supports associations as clauses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user, content: 'hello' })
      const composition = await Composition.create({ user, content: 'goodbye' })
      await HeartRating.create({ extraRateable: composition, user })

      const composition2 = await Composition.create({ user, content: 'goodbye' })
      await HeartRating.create({ extraRateable: composition2, user })

      const reloaded = await User.leftJoin('heartRatings', {
        and: { extraRateable: composition },
      }).firstOrFail()
      expect(reloaded).toMatchDreamModel(user)
    })
  })
})

describe('Dream#leftJoin', () => {
  it('does not apply a default scope to the (already loaded) model we are starting from', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const post = await Post.create({ user })
    const postComment = await PostComment.create({ post, body: 'hello world' })

    await post.destroy()
    await postComment.undestroy()

    expect(await post.leftJoin('comments').pluck('comments.body')).toEqual(['hello world'])
  })

  context('with an association provided as an argument to the and clause', () => {
    it('supports associations as clauses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user, content: 'hello' })
      const composition = await Composition.create({ user, content: 'goodbye' })
      await HeartRating.create({ extraRateable: composition, user })

      const composition2 = await Composition.create({ user, content: 'goodbye' })
      await HeartRating.create({ extraRateable: composition2, user })

      const reloaded = await user
        .leftJoin('heartRatings', {
          and: { extraRateable: composition },
        })
        .firstOrFail()
      expect(reloaded).toMatchDreamModel(user)
    })
  })

  context('when encased in a transaction', () => {
    it('does not apply a default scope to the (already loaded) model we are starting from', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const post = await Post.create({ user })
      const postComment = await PostComment.create({ post, body: 'hello world' })
      await post.destroy()
      await postComment.undestroy()

      await ApplicationModel.transaction(async txn => {
        expect(await post.txn(txn).leftJoin('comments').pluck('comments.body')).toEqual(['hello world'])
      })
    })
  })
})
