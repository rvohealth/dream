import { DateTime } from 'luxon'
import Composition from '../../../../test-app/app/models/Composition'
import User from '../../../../test-app/app/models/User'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel'
import Latex from '../../../../test-app/app/models/Balloon/Latex'

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

    it('supports calling destroy', async () => {
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

      expect(await user.associationQuery('compositionAssets').all()).toMatchDreamModels([
        otherCompositionAsset,
        compositionAsset,
      ])
      expect(await user.associationQuery('compositionAssets').where({ score: 3 }).destroy())
      expect(await user.associationQuery('compositionAssets').all()).toMatchDreamModels([
        otherCompositionAsset,
      ])
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

    context('with order applied to the association', () => {
      it('applies order', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const composition1 = await Composition.create({ user, content: 'a' })
        const composition3 = await Composition.create({ user, content: 'c' })
        const composition4 = await Composition.create({ user, content: 'd' })
        const composition2 = await Composition.create({ user, content: 'b' })

        const results = await user.associationQuery('sortedCompositions').all()
        expect(results[0]).toMatchDreamModel(composition1)
        expect(results[1]).toMatchDreamModel(composition2)
        expect(results[2]).toMatchDreamModel(composition3)
        expect(results[3]).toMatchDreamModel(composition4)
      })
    })

    context('with multiple order statements applied to the association', () => {
      it('applies order', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const composition1 = await Composition.create({ user, content: 'a' })
        const composition3 = await Composition.create({ user, content: 'a' })
        const composition4 = await Composition.create({ user, content: 'b' })
        const composition2 = await Composition.create({ user, content: 'b' })

        const results = await user.associationQuery('sortedCompositions2').all()
        expect(results[0]).toMatchDreamModel(composition3)
        expect(results[1]).toMatchDreamModel(composition1)
        expect(results[2]).toMatchDreamModel(composition2)
        expect(results[3]).toMatchDreamModel(composition4)
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
        expect(await user.txn(txn).associationQuery('recentCompositions').all()).toMatchDreamModels([
          recentComposition,
        ])
      })
    })
  })

  context('HasOne', () => {
    context('with order applied to the association', () => {
      it('applies order', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const composition1 = await Composition.create({ user, content: 'b' })
        const composition2 = await Composition.create({ user, content: 'a' })

        const firstResults = await user.associationQuery('firstComposition').first()
        expect(firstResults).toMatchDreamModel(composition1)

        const lastResults = await user.associationQuery('lastComposition').first()
        expect(lastResults).toMatchDreamModel(composition2)
      })
    })

    context('with multiple order statements applied to the association', () => {
      it('applies order', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const composition1 = await Composition.create({ user, content: 'a' })
        const composition2 = await Composition.create({ user, content: 'b' })
        const composition3 = await Composition.create({ user, content: 'b' })

        const firstResults = await user.associationQuery('firstComposition2').first()
        expect(firstResults).toMatchDreamModel(composition2)
      })
    })
  })

  context('unscoped', () => {
    it('unscopes', async () => {
      const user = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
        deletedAt: DateTime.now(),
      })
      const balloon = await Latex.create({ user, color: 'red', deletedAt: DateTime.now() })

      const query = user.associationQuery('balloons')

      const balloons = await query.all()
      expect(balloons).toEqual([])

      const unscopedBalloons = await query.unscoped().all()
      expect(unscopedBalloons).toMatchDreamModels([balloon])
    })
  })
})
