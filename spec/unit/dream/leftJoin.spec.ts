import UnrecognizedAssociationConditionKeys from '../../../src/errors/associations/UnrecognizedAssociationConditionKeys.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
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

  it('throws on a condition key other than and, andNot and andAny', () => {
    const condition: Record<string, unknown> = { and: { body: 'hello' }, body: 'hello' }

    expect(() => User.leftJoin('posts', condition)).toThrow(UnrecognizedAssociationConditionKeys)
    expect(() => User.leftJoin('posts', condition, 'comments')).toThrow(UnrecognizedAssociationConditionKeys)
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

    it('throws on a condition key other than and, andNot and andAny', async () => {
      const condition: Record<string, unknown> = { and: { body: 'hello' }, body: 'hello' }

      await ApplicationModel.transaction(txn => {
        expect(() => User.txn(txn).leftJoin('posts', condition, 'comments')).toThrow(
          UnrecognizedAssociationConditionKeys
        )
      })
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

  it('throws on a condition key other than and, andNot and andAny', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const condition: Record<string, unknown> = { and: { body: 'hello' }, body: 'hello' }

    expect(() => user.leftJoin('posts', condition)).toThrow(UnrecognizedAssociationConditionKeys)
    expect(() => user.leftJoin('posts', condition, 'comments')).toThrow(UnrecognizedAssociationConditionKeys)
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

    it('throws on a condition key other than and, andNot and andAny', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const condition: Record<string, unknown> = { and: { body: 'hello' }, body: 'hello' }

      await ApplicationModel.transaction(txn => {
        expect(() => user.txn(txn).leftJoin('posts', condition, 'comments')).toThrow(
          UnrecognizedAssociationConditionKeys
        )
      })
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('forbids a condition key other than and, andNot and andAny', () => {
    const user = User.new()

    // @ts-expect-error a condition accepts only and, andNot and andAny
    User.leftJoin('posts', { and: { body: 'hello' }, body: 'hello' })

    // @ts-expect-error a condition accepts only and, andNot and andAny
    User.leftJoin('posts', { and: { body: 'hello' }, body: 'hello' }, 'comments')

    // @ts-expect-error a condition accepts only and, andNot and andAny
    user.leftJoin('posts', { and: { body: 'hello' }, body: 'hello' })

    // @ts-expect-error a condition accepts only and, andNot and andAny
    user.leftJoin('posts', { and: { body: 'hello' }, body: 'hello' }, 'comments')
  })

  context('in a transaction', () => {
    it('forbids a condition key other than and, andNot and andAny', async () => {
      await ApplicationModel.transaction(txn => {
        const user = User.new()

        // @ts-expect-error a condition accepts only and, andNot and andAny
        User.txn(txn).leftJoin('posts', { and: { body: 'hello' }, body: 'hello' })

        // @ts-expect-error a condition accepts only and, andNot and andAny
        User.txn(txn).leftJoin('posts', { and: { body: 'hello' }, body: 'hello' }, 'comments')

        // @ts-expect-error a condition accepts only and, andNot and andAny
        user.txn(txn).leftJoin('posts', { and: { body: 'hello' }, body: 'hello' })

        // @ts-expect-error a condition accepts only and, andNot and andAny
        user.txn(txn).leftJoin('posts', { and: { body: 'hello' }, body: 'hello' }, 'comments')
      })
    })
  })
})
