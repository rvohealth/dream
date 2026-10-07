import UnrecognizedAssociationConditionKeys from '../../../../src/errors/associations/UnrecognizedAssociationConditionKeys.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Post from '../../../../test-app/app/models/Post.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream#undestroyAssociation', () => {
  it('undestroys the soft-deleted associated records the and-clause selects', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const post1 = await Post.create({ user, body: 'hello' })
    const post2 = await Post.create({ user, body: 'goodbye' })
    await post1.destroy()
    await post2.destroy()

    await user.undestroyAssociation('posts', { and: { body: 'hello' } })

    expect((await Post.all()).map(post => post.id)).toEqual([post1.id])
  })

  context('with an option other than and, andNot, andAny and the documented options', () => {
    it('rejects the call without undestroying any associated record', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const post1 = await Post.create({ user, body: 'hello' })
      const post2 = await Post.create({ user, body: 'goodbye' })
      await post1.destroy()
      await post2.destroy()
      const options: Record<string, unknown> = { cascade: false, body: 'hello' }

      await expect(user.undestroyAssociation('posts', options)).rejects.toThrow(
        UnrecognizedAssociationConditionKeys
      )
      expect(await Post.all()).toEqual([])
    })

    context('in a transaction', () => {
      it('rejects the call without undestroying any associated record', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const post1 = await Post.create({ user, body: 'hello' })
        const post2 = await Post.create({ user, body: 'goodbye' })
        await post1.destroy()
        await post2.destroy()
        const options: Record<string, unknown> = { cascade: false, body: 'hello' }

        await expect(
          ApplicationModel.transaction(
            async txn => await user.txn(txn).undestroyAssociation('posts', options)
          )
        ).rejects.toThrow(UnrecognizedAssociationConditionKeys)
        expect(await Post.all()).toEqual([])
      })
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('forbids an option other than and, andNot, andAny and the documented options', async () => {
    const user = User.new()

    // @ts-expect-error only the condition keys and the documented options are accepted
    await user.undestroyAssociation('posts', { and: { body: 'hello' }, body: 'hello' })

    // @ts-expect-error only the condition keys and the documented options are accepted
    await user.undestroyAssociation('posts', { cascade: false, body: 'hello' })
  })

  context('in a transaction', () => {
    it('forbids an option other than and, andNot, andAny and the documented options', async () => {
      await ApplicationModel.transaction(async txn => {
        const user = User.new()

        // @ts-expect-error only the condition keys and the documented options are accepted
        await user.txn(txn).undestroyAssociation('posts', { and: { body: 'hello' }, body: 'hello' })
      })
    })
  })
})
