import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Mylar from '../../../test-app/app/models/Balloon/Mylar'
import BalloonLine from '../../../test-app/app/models/BalloonLine'
import Composition from '../../../test-app/app/models/Composition'
import Post from '../../../test-app/app/models/Post'
import PostComment from '../../../test-app/app/models/PostComment'
import User from '../../../test-app/app/models/User'

describe('Dream.innerJoin', () => {
  it('joins a HasOne association, omitting models that don’t have an associated model', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    await Composition.create({ userId: user.id, primary: true })

    const reloadedUsers = await User.innerJoin('mainComposition').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  context('when encased in a transaction', () => {
    it('joins a HasOne association, omitting models that don’t have an associated model', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      await Composition.create({ userId: user.id, primary: true })
      let reloadedUsers: User[]

      await ApplicationModel.transaction(async txn => {
        reloadedUsers = await User.txn(txn).innerJoin('mainComposition').all()
        expect(reloadedUsers).toMatchDreamModels([user])
      })
    })
  })
})

describe('Dream#innerJoin', () => {
  it('does not apply a default scope to the (already loaded) model we are starting from', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const post = await Post.create({ user })
    const postComment = await PostComment.create({ post, body: 'hello world' })

    await post.destroy()
    await postComment.undestroy()

    expect(await post.innerJoin('comments').pluck('comments.body')).toEqual(['hello world'])
  })

  context('when encased in a transaction', () => {
    it('does not apply a default scope to the (already loaded) model we are starting from', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const post = await Post.create({ user })
      const postComment = await PostComment.create({ post, body: 'hello world' })
      await post.destroy()
      await postComment.undestroy()

      await ApplicationModel.transaction(async txn => {
        expect(await post.txn(txn).innerJoin('comments').pluck('comments.body')).toEqual(['hello world'])
      })
    })
  })

  context('on an associationQuery', () => {
    it('columns corresponding to the root of the query are namespaced to the association name in associationQuery', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const balloon = await Mylar.create({ user, color: 'red' })
      await BalloonLine.create({ balloon, material: 'nylon' })

      const colors = await user.associationQuery('balloons').innerJoin('balloonLine').pluck('balloons.color')
      expect(colors[0]).toEqual('red')
    })

    context('when encased in a transaction', () => {
      it('columns corresponding to the root of the query are namespaced to the association name in associationQuery', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const balloon = await Mylar.create({ user, color: 'red' })
        await BalloonLine.create({ balloon, material: 'nylon' })

        await ApplicationModel.transaction(async txn => {
          const colors = await user
            .txn(txn)
            .associationQuery('balloons')
            .innerJoin('balloonLine')
            .pluck('balloons.color')
          expect(colors[0]).toEqual('red')
        })
      })
    })
  })
})
