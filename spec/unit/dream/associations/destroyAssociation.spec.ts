import { DateTime } from 'luxon'
import User from '../../../../test-app/app/models/User'
import Post from '../../../../test-app/app/models/Post'
import Composition from '../../../../test-app/app/models/Composition'
import CannotDestroyAssociationWithThroughContext from '../../../../src/exceptions/associations/cannot-destroy-association-with-through-context'
import { Dream } from '../../../../src'

describe('Dream#destroyAssociation', () => {
  context('with a HasMany association', () => {
    it('destroys the related association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'fredz@frewd', password: 'howyadoin' })
      const composition = await user.createAssociation('compositions')
      const composition2 = await user2.createAssociation('compositions')

      expect(await Composition.all()).toMatchDreamModels([composition, composition2])
      expect(await user.associationQuery('compositions').all()).toMatchDreamModels([composition])
      await user.destroyAssociation('compositions')

      expect(await user.associationQuery('compositions').all()).toEqual([])
      expect(await Composition.all()).toMatchDreamModels([composition2])
    })
  })

  context('with a HasMany through association', () => {
    it('raises a targeted exception, alerting the user to their mistake', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      expect(async () => await user.destroyAssociation('compositionAssets')).rejects.toThrowError(
        CannotDestroyAssociationWithThroughContext
      )
    })
  })

  context('with a HasOne association', () => {
    it('destroys the related association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const createdAt = DateTime.now().minus({ days: 1 })
      const userSettings = await user.createAssociation('userSettings', { created_at: createdAt })
      expect(await user.associationQuery('userSettings').all()).toMatchDreamModels([userSettings])

      await user.destroyAssociation('userSettings')
      expect(await user.associationQuery('userSettings').all()).toEqual([])
    })
  })

  context('with a HasOne through association', () => {
    it('raises a targeted exception, alerting the user to their mistake', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      expect(async () => await user.destroyAssociation('mainCompositionAsset')).rejects.toThrowError(
        CannotDestroyAssociationWithThroughContext
      )
    })
  })

  context('with an optional BelongsTo association', () => {
    it('destroys the related association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const post = await Post.create({ user, body: 'howyadoin' })
      const createdAt = DateTime.now().minus({ days: 1 })
      const postVisibility = await post.createAssociation('postVisibility', { created_at: createdAt })
      expect(await post.associationQuery('postVisibility').first()).toMatchDreamModel(postVisibility)

      await post.destroyAssociation('postVisibility')

      expect(await post.associationQuery('postVisibility').first()).toBeNull()
    })
  })

  context('when in a transaction', () => {
    it('destroys the related association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'fredz@frewd', password: 'howyadoin' })
      const composition = await user.createAssociation('compositions')
      const composition2 = await user2.createAssociation('compositions')

      expect(await Composition.all()).toMatchDreamModels([composition, composition2])
      expect(await user.associationQuery('compositions').all()).toMatchDreamModels([composition])

      await Dream.transaction(async txn => {
        await user.txn(txn).destroyAssociation('compositions')
      })

      expect(await user.associationQuery('compositions').all()).toEqual([])
      expect(await Composition.all()).toMatchDreamModels([composition2])
    })
  })
})
