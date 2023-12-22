import { DateTime } from 'luxon'
import { Dream } from '../../../../src'
import Composition from '../../../../test-app/app/models/Composition'
import User from '../../../../test-app/app/models/User'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel'
import Pet from '../../../../test-app/app/models/Pet'

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

      it('respects scopes on the associated model', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const pet1 = await Pet.create({ user, name: 'petb' })
        const pet2 = await Pet.create({ user, name: 'peta' })
        await pet2.destroy()

        await user.associationUpdateQuery('firstPet').updateAll({ name: 'coolidge' })

        await pet1.reload()
        const reloadedPet2 = await Pet.unscoped().find(pet2.id)

        expect(pet1.name).toEqual('coolidge')
        expect(reloadedPet2!.name).toEqual('peta')
      })

      context.skip('with a subsequent order defined on query', () => {
        it('respects order', async () => {
          const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
          const pet1 = await Pet.create({ user, name: 'petb' })
          const pet2 = await Pet.create({ user, name: 'peta' })

          await user.associationUpdateQuery('firstPet').order('id', 'asc').updateAll({ name: 'coolidge' })

          await pet1.reload()
          await pet2.reload()

          expect(pet1.name).toEqual('petb')
          expect(pet2.name).toEqual('coolidge')
        })

        it('respects scopes on the associated model', async () => {
          const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
          const pet1 = await Pet.create({ user, name: 'petb' })
          const pet2 = await Pet.create({ user, name: 'peta' })
          await pet2.destroy()

          await user.associationUpdateQuery('firstPet').order('name', 'desc').updateAll({ name: 'coolidge' })

          await pet1.reload()
          const reloadedPet2 = await Pet.unscoped().find(pet2.id)

          expect(pet1.name).toEqual('coolidge')
          expect(reloadedPet2!.name).toEqual('peta')
        })
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
