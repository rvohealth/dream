import { DateTime } from 'luxon'
import { Dream } from '../../../../src'
import Composition from '../../../../test-app/app/models/Composition'
import User from '../../../../test-app/app/models/User'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'

describe('Dream#associationQuery', () => {
  context('with a HasMany association', () => {
    it('returns a chainable query encapsulating that association', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const otherRecentComposition = await Composition.create({ user: otherUser })

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const recentComposition = await Composition.create({ user })
      const olderComposition = await Composition.create({
        user,
        createdAt: DateTime.now().minus({ year: 1 }),
      })

      expect(await user.associationQuery('recentCompositions').all()).toMatchDreamModels([recentComposition])
    })

    context('hasMany through', () => {
      it('returns a chainable query encapsulating that association', async () => {
        const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const otherRecentComposition = await Composition.create({ user: otherUser })

        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const recentComposition = await Composition.create({ user })
        const olderComposition = await Composition.create({
          user,
          createdAt: DateTime.now().minus({ year: 1 }),
        })

        const compositionAsset1 = await CompositionAsset.create({ composition: recentComposition })
        const compositionAsset2 = await CompositionAsset.create({ composition: olderComposition })

        expect(await user.associationQuery('recentCompositionAssets').all()).toMatchDreamModels([
          compositionAsset1,
        ])
      })
    })

    it('supports chaining of where and findBy', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const composition = await Composition.create({ user, content: 'howyadoin' })
      const otherCompositionAsset = await CompositionAsset.create({
        composition,
        name: 'asset 0',
        score: 1,
      })
      const compositionAsset = await CompositionAsset.create({
        composition,
        name: 'asset 1',
        score: 3,
      })

      expect(await user.associationQuery('compositionAssets').findBy({ score: 3 })).toMatchDreamModel(
        compositionAsset
      )

      expect(await user.associationQuery('compositionAssets').where({ score: 3 }).first()).toMatchDreamModel(
        compositionAsset
      )

      expect(await otherUser.associationQuery('compositionAssets').findBy({ score: 3 })).toBeNull()
    })

    it('supports chaining of subsequent joins', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const composition = await Composition.create({ user, content: 'howyadoin' })
      const otherCompositionAsset = await CompositionAsset.create({
        composition,
        name: 'asset 0',
        score: 1,
      })
      const compositionAsset = await CompositionAsset.create({
        composition,
        name: 'asset 1',
        score: 3,
      })

      expect(
        await user.associationQuery('compositions').joins('compositionAssets', { score: 3 }).first()
      ).toMatchDreamModel(composition)

      expect(
        await user.associationQuery('compositions').joins('compositionAssets', { score: 7 }).first()
      ).toBeNull()

      expect(
        await user
          .associationQuery('compositions')
          .joins('compositionAssets', 'compositionAssetAudits')
          .first()
      ).toBeNull()
    })
  })

  context('when in a transaction', () => {
    it('returns a chainable query encapsulating that association', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const otherRecentComposition = await Composition.create({ user: otherUser })

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const recentComposition = await Composition.create({ user })
      const olderComposition = await Composition.create({
        user,
        createdAt: DateTime.now().minus({ year: 1 }),
      })

      await Dream.transaction(async txn => {
        expect(await user.txn(txn).associationQuery('recentCompositions').all()).toMatchDreamModels([
          recentComposition,
        ])
      })
    })
  })
})
