import { DateTime } from 'luxon'
import Composition from '../../../../test-app/app/models/Composition'
import User from '../../../../test-app/app/models/User'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel'
import Pet from '../../../../test-app/app/models/Pet'
import Collar from '../../../../test-app/app/models/Collar'
import MissingRequiredAssociationWhereClause from '../../../../src/exceptions/associations/missing-required-association-where-clause'
import LocalizedText from '../../../../test-app/app/models/LocalizedText'

describe('Dream#associationUpdateQuery', () => {
  context('with a HasMany association', () => {
    it('returns a chainable query encapsulating that association', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user: otherUser })

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const recentComposition = await Composition.create({ user })
      await Composition.create({
        user,
        createdAt: DateTime.now().minus({ year: 1 }),
      })

      expect(await user.associationUpdateQuery('recentCompositions').all()).toMatchDreamModels([
        recentComposition,
      ])
    })

    context('with a primary key override', () => {
      it('leverages primary key override', async () => {
        const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Pet.create({ userUuid: otherUser.uuid })

        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const pet = await Pet.create({ userUuid: user.uuid })

        expect(await user.associationUpdateQuery('petsFromUuid').all()).toMatchDreamModels([pet])
      })
    })

    context('when a "requiredWhereClause" isn’t passed', () => {
      it('throws MissingRequiredAssociationWhereClause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })

        await expect(
          async () =>
            await (composition.associationUpdateQuery as any)('inlineWhereCurrentLocalizedText').updateAll({
              name: 'Name was updated',
            })
        ).rejects.toThrow(MissingRequiredAssociationWhereClause)
      })
    })

    context('when a "requiredWhereClause" is passed', () => {
      it('applies the where clause to the association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        const localizedTextToLeaveAlone = await LocalizedText.create({
          localizable: composition,
          locale: 'en-US',
          name: 'Hello',
        })
        const localizedTextToUpdate = await LocalizedText.create({
          localizable: composition,
          locale: 'es-ES',
          name: 'World',
        })

        await composition
          .associationUpdateQuery('inlineWhereCurrentLocalizedText', { locale: 'es-ES' })
          .updateAll({
            name: 'Name was updated',
          })

        await localizedTextToLeaveAlone.reload()
        await localizedTextToUpdate.reload()

        expect(localizedTextToLeaveAlone.name).toEqual('Hello')
        expect(localizedTextToUpdate.name).toEqual('Name was updated')
      })
    })

    context('hasMany through', () => {
      it('returns a chainable query encapsulating that association', async () => {
        const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({ user: otherUser })

        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const recentComposition = await Composition.create({ user })
        const olderComposition = await Composition.create({
          user,
          createdAt: DateTime.now().minus({ year: 1 }),
        })

        const compositionAsset1 = await CompositionAsset.create({ composition: recentComposition })
        await CompositionAsset.create({ composition: olderComposition })

        expect(await user.associationUpdateQuery('recentCompositionAssets').all()).toMatchDreamModels([
          compositionAsset1,
        ])
      })

      context('with a primary key override', () => {
        it('leverages primary key override', async () => {
          const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const otherPet = await Pet.create({ userUuid: otherUser.uuid })
          await Collar.create({ pet: otherPet })

          const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
          const pet = await Pet.create({ userUuid: user.uuid })
          const collar = await Collar.create({ pet })

          expect(await user.associationUpdateQuery('collarsFromUuid').all()).toMatchDreamModels([collar])
        })
      })
    })

    it('supports chaining of where and findBy', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const composition = await Composition.create({ user, content: 'howyadoin' })
      await CompositionAsset.create({
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
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const composition = await Composition.create({ user, content: 'howyadoin' })
      await CompositionAsset.create({
        composition,
        name: 'asset 0',
        score: 1,
      })
      await CompositionAsset.create({
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

        expect(composition2.content).toEqual('zoomba')
        expect(composition1.content).toEqual('1')
      })

      it('respects multiple order statements', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const composition1 = await Composition.create({ user, content: '1' })
        const composition2 = await Composition.create({ user, content: '2' })
        const composition3 = await Composition.create({ user, content: '2' })

        await user.associationUpdateQuery('firstComposition2').updateAll({ content: 'zoomba' })
        await composition1.reload()
        await composition2.reload()
        await composition3.reload()

        expect(composition2.content).toEqual('zoomba')
        expect(composition1.content).toEqual('1')
        expect(composition3.content).toEqual('2')
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

      context('with a subsequent order defined on query', () => {
        it('respects both orders', async () => {
          const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
          const pet1 = await Pet.create({ user, name: 'petb' })
          const pet2 = await Pet.create({ user, name: 'peta' })

          await user.associationUpdateQuery('firstPet').order('id').updateAll({ name: 'coolidge' })

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

          await user
            .associationUpdateQuery('firstPet')
            .order({ name: 'desc' })
            .updateAll({ name: 'coolidge' })

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
      await Composition.create({ user: otherUser })

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const recentComposition = await Composition.create({ user })
      await Composition.create({
        user,
        createdAt: DateTime.now().minus({ year: 1 }),
      })

      await ApplicationModel.transaction(async txn => {
        expect(await user.txn(txn).associationUpdateQuery('recentCompositions').all()).toMatchDreamModels([
          recentComposition,
        ])
      })
    })

    context('with a primary key override', () => {
      it('leverages primary key override', async () => {
        let pet: Pet | undefined = undefined
        let user: User | undefined = undefined
        await ApplicationModel.transaction(async txn => {
          const otherUser = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
          await Pet.txn(txn).create({ userUuid: otherUser.uuid })

          user = await User.txn(txn).create({ email: 'fred@fred', password: 'howyadoin' })
          pet = await Pet.txn(txn).create({ userUuid: user.uuid })
        })

        expect(await user!.associationUpdateQuery('petsFromUuid').all()).toMatchDreamModels([pet])
      })
    })
  })
})
