import { DateTime } from 'luxon'
import User from '../../../../test-app/app/models/User'
import Post from '../../../../test-app/app/models/Post'
import CannotCreateAssociationWithThroughContext from '../../../../src/exceptions/associations/cannot-create-association-with-through-context'
import { Dream } from '../../../../src'
import PostVisibility from '../../../../test-app/app/models/PostVisibility'

describe('Dream#createAssociation', () => {
  context('with a HasMany association', () => {
    it('creates the related association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const createdAt = DateTime.now().minus({ days: 1 })
      const composition = await user.createAssociation('compositions', { created_at: createdAt })

      expect(composition.created_at).toEqual(createdAt)
      expect(await user.associationQuery('compositions').all()).toMatchDreamModels([composition])
    })
  })

  context('with a HasMany through association', () => {
    it('raises a targeted exception, alerting the user to their mistake', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      expect(async () => await user.createAssociation('compositionAssets', {})).rejects.toThrowError(
        CannotCreateAssociationWithThroughContext
      )
    })
  })

  context('with a HasOne association', () => {
    it('creates the related association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const createdAt = DateTime.now().minus({ days: 1 })
      const userSettings = await user.createAssociation('userSettings', { created_at: createdAt })

      expect(userSettings.created_at).toEqual(createdAt)
      expect(await user.associationQuery('userSettings').all()).toMatchDreamModels([userSettings])
    })
  })

  context('with a HasOne through association', () => {
    it('raises a targeted exception, alerting the user to their mistake', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      expect(async () => await user.createAssociation('mainCompositionAsset', {})).rejects.toThrowError(
        CannotCreateAssociationWithThroughContext
      )
    })
  })

  context('with an optional BelongsTo association', () => {
    it('creates the related association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const post = await Post.create({ user, body: 'howyadoin' })
      const createdAt = DateTime.now().minus({ days: 1 })
      const postVisibility = await post.createAssociation('postVisibility', { created_at: createdAt })

      expect(postVisibility.created_at).toEqual(createdAt)
      expect(await post.associationQuery('postVisibility').first()).toMatchDreamModel(postVisibility)
    })
  })

  context('when in a transaction', () => {
    it('creates the related association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const createdAt = DateTime.now().minus({ days: 1 })

      await Dream.transaction(async txn => {
        const composition = await user.txn(txn).createAssociation('compositions', { created_at: createdAt })

        expect(composition.created_at).toEqual(createdAt)
        expect(await user.txn(txn).associationQuery('compositions').all()).toMatchDreamModels([composition])
      })
    })

    context('with an optional BelongsTo association', () => {
      it('creates the related association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const post = await Post.create({ user, body: 'howyadoin' })
        const createdAt = DateTime.now().minus({ days: 1 })

        await Dream.transaction(async txn => {
          const postVisibility = await post
            .txn(txn)
            .createAssociation('postVisibility', { created_at: createdAt })

          expect(postVisibility.created_at).toEqual(createdAt)
          expect(await PostVisibility.txn(txn).count()).toEqual(1)
          expect(await post.txn(txn).associationQuery('postVisibility').first()).toMatchDreamModel(
            postVisibility
          )
        })
      })
    })
  })
})
