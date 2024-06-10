import { DateTime } from 'luxon'
import MissingRequiredAssociationWhereClause from '../../../../src/exceptions/associations/missing-required-association-where-clause'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel'
import Collar from '../../../../test-app/app/models/Collar'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import LocalizedText from '../../../../test-app/app/models/LocalizedText'
import Pet from '../../../../test-app/app/models/Pet'
import User from '../../../../test-app/app/models/User'

describe('Dream#updateAssociation', () => {
  it('calls model hooks for each associated record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await user.createAssociation('compositions')
    const compositionAsset = await composition.createAssociation('compositionAssets', { src: 'howyadoin' })

    await composition.updateAssociation('compositionAssets', { src: null })

    await compositionAsset.reload()
    expect(compositionAsset.src).toEqual('default src')
  })

  context('when skipHooks is true', () => {
    it('does not call model hooks', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await user.createAssociation('compositions')
      const compositionAsset = await composition.createAssociation('compositionAssets', { src: 'howyadoin' })

      await composition.updateAssociation('compositionAssets', { src: null }, { skipHooks: true })

      await compositionAsset.reload()
      expect(compositionAsset.src).toBeNull()
    })
  })

  context('with a HasMany association', () => {
    it('updates the association', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user: otherUser })

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const recentComposition1 = await Composition.create({ user })
      const recentComposition2 = await Composition.create({ user })
      const unrelatedComposition = await Composition.create({
        user,
        createdAt: DateTime.now().minus({ year: 1 }),
        content: 'goodbye world',
      })

      await user.updateAssociation('recentCompositions', { content: 'hello world' })
      await recentComposition1.reload()
      await recentComposition2.reload()
      await unrelatedComposition.reload()

      expect(recentComposition1.content).toEqual('hello world')
      expect(recentComposition2.content).toEqual('hello world')
      expect(unrelatedComposition.content).toEqual('goodbye world')
    })

    context('with a primary key override', () => {
      it('leverages primary key override', async () => {
        const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Pet.create({ userUuid: otherUser.uuid })

        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const pet = await Pet.create({ userUuid: user.uuid })
        const unrelatedPet = await Pet.create({ user: user, name: 'chalupa joe' })

        await user.updateAssociation('petsFromUuid', { name: 'aster' })
        await pet.reload()
        await unrelatedPet.reload()

        expect(pet.name).toEqual('aster')
        expect(unrelatedPet.name).toEqual('chalupa joe')
      })
    })

    context('when a "requiredWhereClause" isn’t passed', () => {
      it('throws MissingRequiredAssociationWhereClause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })

        await expect(
          async () =>
            await (composition.updateAssociation as any)('inlineWhereCurrentLocalizedText', {
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

        await composition.updateAssociation(
          'inlineWhereCurrentLocalizedText',
          {
            name: 'Name was updated',
          },
          { where: { locale: 'es-ES' } }
        )

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

        const compositionAsset = await CompositionAsset.create({
          composition: recentComposition,
          name: 'asset 1',
        })
        const unrelatedCompositionAsset = await CompositionAsset.create({
          composition: olderComposition,
          name: 'asset 2',
        })

        expect(await user.updateAssociation('recentCompositionAssets', { name: 'howyadoin' })).toEqual(1)
        await compositionAsset.reload()
        await unrelatedCompositionAsset.reload()

        expect(compositionAsset.name).toEqual('howyadoin')
        expect(unrelatedCompositionAsset.name).toEqual('asset 2')
      })

      context('with a primary key override', () => {
        it('leverages primary key override', async () => {
          const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const otherPet = await Pet.create({ userUuid: otherUser.uuid })
          await Collar.create({ pet: otherPet })

          const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
          const pet = await Pet.create({ userUuid: user.uuid })
          const unrelatedPet = await Pet.create({ user: user })
          const collar = await Collar.create({ pet })
          const unrelatedCollar = await Collar.create({ pet: unrelatedPet, tagName: 'unrelated' })

          expect(await user.updateAssociation('collarsFromUuid', { tagName: 'howdy' })).toEqual(1)

          await collar.reload()
          await unrelatedCollar.reload()

          expect(collar.tagName).toEqual('howdy')
          expect(unrelatedCollar.tagName).toEqual('unrelated')
        })
      })
    })
  })

  context('HasOne', () => {
    context('with order defined on association', () => {
      it('respects order', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const composition1 = await Composition.create({ user, content: '1' })
        const composition2 = await Composition.create({ user, content: '2' })

        await user.updateAssociation('lastComposition', { content: 'zoomba' })
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

        await user.updateAssociation('firstComposition2', { content: 'zoomba' })
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

        await user.updateAssociation('firstPet', { name: 'coolidge' })

        await pet1.reload()
        const reloadedPet2 = await Pet.unscoped().find(pet2.id)

        expect(pet1.name).toEqual('coolidge')
        expect(reloadedPet2!.name).toEqual('peta')
      })
    })
  })

  context('when in a transaction', () => {
    it('returns a chainable query encapsulating that association', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user: otherUser })

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })

      await ApplicationModel.transaction(async txn => {
        const recentComposition = await Composition.txn(txn).create({ user, content: 'a' })
        const unrelatedComposition = await Composition.txn(txn).create({
          user,
          createdAt: DateTime.now().minus({ year: 1 }),
          content: 'b',
        })

        expect(
          await user
            .txn(txn)
            .updateAssociation('recentCompositions', { content: 'hello world' }, { skipHooks: false })
        ).toEqual(1)

        await recentComposition.txn(txn).reload()
        await unrelatedComposition.txn(txn).reload()
        expect(recentComposition.content).toEqual('hello world')
        expect(unrelatedComposition.content).toEqual('b')
      })
    })

    context('with a primary key override', () => {
      it('leverages primary key override', async () => {
        let user: User | undefined = undefined
        let pet: Pet | undefined = undefined
        let unrelatedPet: Pet | undefined = undefined
        await ApplicationModel.transaction(async txn => {
          const otherUser = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
          await Pet.txn(txn).create({ userUuid: otherUser.uuid })

          user = await User.txn(txn).create({ email: 'fred@fred', password: 'howyadoin' })
          pet = await Pet.txn(txn).create({ userUuid: user.uuid })
          unrelatedPet = await Pet.txn(txn).create({ user: user, name: 'chalupa joe' })

          expect(await user.txn(txn).updateAssociation('petsFromUuid', { name: 'aster' })).toEqual(1)
        })

        await pet!.reload()
        await unrelatedPet!.reload()
        expect(pet!.name).toEqual('aster')
        expect(unrelatedPet!.name).toEqual('chalupa joe')
      })
    })
  })
})
