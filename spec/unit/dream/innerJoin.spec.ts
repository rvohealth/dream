import UnrecognizedAssociationConditionKeys from '../../../src/errors/associations/UnrecognizedAssociationConditionKeys.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import BalloonLine from '../../../test-app/app/models/BalloonLine.js'
import Composition from '../../../test-app/app/models/Composition.js'
import Post from '../../../test-app/app/models/Post.js'
import PostComment from '../../../test-app/app/models/PostComment.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.innerJoin', () => {
  it('joins a HasOne association, omitting models that don’t have an associated model', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    await Composition.create({ userId: user.id, primary: true })

    const reloadedUsers = await User.innerJoin('mainComposition').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  it('throws on a condition key other than and, andNot and andAny', () => {
    const condition: Record<string, unknown> = { and: { body: 'hello' }, body: 'hello' }

    expect(() => User.innerJoin('posts', condition)).toThrow(UnrecognizedAssociationConditionKeys)
    expect(() => User.innerJoin('posts', condition, 'comments')).toThrow(UnrecognizedAssociationConditionKeys)
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

    it('throws on a condition key other than and, andNot and andAny', async () => {
      const condition: Record<string, unknown> = { and: { body: 'hello' }, body: 'hello' }

      await ApplicationModel.transaction(txn => {
        expect(() => User.txn(txn).innerJoin('posts', condition, 'comments')).toThrow(
          UnrecognizedAssociationConditionKeys
        )
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

  it('throws on a condition key other than and, andNot and andAny', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const condition: Record<string, unknown> = { and: { body: 'hello' }, body: 'hello' }

    expect(() => user.innerJoin('posts', condition)).toThrow(UnrecognizedAssociationConditionKeys)
    expect(() => user.innerJoin('posts', condition, 'comments')).toThrow(UnrecognizedAssociationConditionKeys)
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

    it('throws on a condition key other than and, andNot and andAny', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const condition: Record<string, unknown> = { and: { body: 'hello' }, body: 'hello' }

      await ApplicationModel.transaction(txn => {
        expect(() => user.txn(txn).innerJoin('posts', condition, 'comments')).toThrow(
          UnrecognizedAssociationConditionKeys
        )
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

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('forbids a condition key other than and, andNot and andAny', () => {
    const user = User.new()

    // @ts-expect-error a condition accepts only and, andNot and andAny
    User.innerJoin('posts', { and: { body: 'hello' }, body: 'hello' })

    // @ts-expect-error a condition accepts only and, andNot and andAny
    User.innerJoin('posts', { and: { body: 'hello' }, body: 'hello' }, 'comments')

    // @ts-expect-error a condition accepts only and, andNot and andAny
    user.innerJoin('posts', { and: { body: 'hello' }, body: 'hello' })

    // @ts-expect-error a condition accepts only and, andNot and andAny
    user.innerJoin('posts', { and: { body: 'hello' }, body: 'hello' }, 'comments')

    // allowed: and, andNot and andAny together, at the end of the chain and mid-chain
    User.innerJoin('posts', { and: { body: 'hello' }, andNot: { body: 'goodbye' }, andAny: [{ body: 'hi' }] })
    User.innerJoin('posts', { and: { body: 'hello' }, andNot: { body: 'goodbye' } }, 'comments')
  })

  context('in a transaction', () => {
    it('forbids a condition key other than and, andNot and andAny', async () => {
      await ApplicationModel.transaction(txn => {
        const user = User.new()

        // @ts-expect-error a condition accepts only and, andNot and andAny
        User.txn(txn).innerJoin('posts', { and: { body: 'hello' }, body: 'hello' })

        // @ts-expect-error a condition accepts only and, andNot and andAny
        User.txn(txn).innerJoin('posts', { and: { body: 'hello' }, body: 'hello' }, 'comments')

        // @ts-expect-error a condition accepts only and, andNot and andAny
        user.txn(txn).innerJoin('posts', { and: { body: 'hello' }, body: 'hello' })

        // @ts-expect-error a condition accepts only and, andNot and andAny
        user.txn(txn).innerJoin('posts', { and: { body: 'hello' }, body: 'hello' }, 'comments')
      })
    })
  })
})
