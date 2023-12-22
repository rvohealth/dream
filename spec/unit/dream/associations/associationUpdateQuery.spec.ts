import { DateTime } from 'luxon'
import { Dream } from '../../../../src'
import Composition from '../../../../test-app/app/models/Composition'
import User from '../../../../test-app/app/models/User'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel'

describe('Dream#associationUpdateQuery', () => {
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

      expect(await user.associationUpdateQuery('recentCompositions').all()).toMatchDreamModels([
        recentComposition,
      ])
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

        expect(await user.associationUpdateQuery('recentCompositionAssets').all()).toMatchDreamModels([
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

      expect(await user.associationUpdateQuery('compositionAssets').findBy({ score: 3 })).toMatchDreamModel(
        compositionAsset
      )

      expect(
        await user.associationUpdateQuery('compositionAssets').where({ score: 3 }).first()
      ).toMatchDreamModel(compositionAsset)

      expect(await otherUser.associationUpdateQuery('compositionAssets').findBy({ score: 3 })).toBeNull()
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
        await user.associationUpdateQuery('compositions').joins('compositionAssets', { score: 3 }).first()
      ).toMatchDreamModel(composition)

      expect(
        await user.associationUpdateQuery('compositions').joins('compositionAssets', { score: 7 }).first()
      ).toBeNull()

      expect(
        await user
          .associationUpdateQuery('compositions')
          .joins('compositionAssets', 'compositionAssetAudits')
          .first()
      ).toBeNull()
    })
  })

  context('HasOne', () => {
    context('with order defined on association', () => {
      it('respects order', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const composition1 = await Composition.create({ user, content: '1' })
        const composition2 = await Composition.create({ user, content: '2' })

        await user.associationUpdateQuery('lastComposition').updateAll({ content: 'zoomba' })
        await composition1.reload()
        await composition2.reload()

        expect(composition1.content).toEqual('1')
        expect(composition2.content).toEqual('zoomba')
      })
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

      await ApplicationModel.transaction(async txn => {
        expect(await user.txn(txn).associationUpdateQuery('recentCompositions').all()).toMatchDreamModels([
          recentComposition,
        ])
      })
    })
  })
})
