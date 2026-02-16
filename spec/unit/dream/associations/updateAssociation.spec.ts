import CannotUpdateAssociationOnUnpersistedDream from '../../../../src/errors/associations/CannotUpdateAssociationOnUnpersistedDream.js'
import MissingRequiredAssociationAndClause from '../../../../src/errors/associations/MissingRequiredAssociationAndClause.js'
import CannotPassUndefinedAsAValueToAWhereClause from '../../../../src/errors/CannotPassUndefinedAsAValueToAWhereClause.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Collar from '../../../../test-app/app/models/Collar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset.js'
import LocalizedText from '../../../../test-app/app/models/LocalizedText.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream#updateAssociation', () => {
  context('with an and-clause', () => {
    it('limits the update to the and-clause', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const aster = await Pet.create({ user, name: 'Aster', species: 'cat' })
      const violet = await Pet.create({ user, name: 'Violet', species: 'frog' })

      await user.updateAssociation('pets', { species: 'dog' }, { and: { id: violet.id } })

      await aster.reload()
      await violet.reload()

      expect(aster.species).toEqual('cat')
      expect(violet.species).toEqual('dog')
    })

    context('with an association provided as an attribute during update', () => {
      it('persists the associated record', async () => {
        const pet = await Pet.create({ name: 'Aster' })
        const user = await pet.createAssociation('user', {
          email: 'fred@fred',
          password: 'howyadoin',
        })
        const balloon = await Mylar.create({ user })
        const collar = await pet.createAssociation('collars')
        await pet.updateAssociation('collars', { balloon })

        await collar.reload()
        expect(collar.balloonId).toEqual(balloon.id)
      })
    })

    it('retains the association based limits', async () => {
      const user1 = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const aster = await Pet.create({ user: user1, name: 'Aster', species: 'cat' })

      const user2 = await User.create({ email: 'frewd@fred', password: 'howyadoin' })
      const violet = await Pet.create({ user: user2, name: 'Violet', species: 'frog' })

      await user1.updateAssociation('pets', { species: 'dog' }, { and: { id: violet.id } })

      await aster.reload()
      await violet.reload()

      expect(aster.species).toEqual('cat')
      expect(violet.species).toEqual('frog')
    })
  })

  context('with undefined passed in an and-clause', () => {
    it('raises an exception', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      await expect(
        async () =>
          await user.updateAssociation('pets', { name: 'howyadoin' }, { and: { name: undefined as any } })
      ).rejects.toThrowError(CannotPassUndefinedAsAValueToAWhereClause)
    })

    context('when undefined is applied at the association level', () => {
      context('and-clause has an undefined value', () => {
        it('raises an exception', async () => {
          const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
          const post = await user.createAssociation('posts')

          await expect(
            async () => await post.updateAssociation('invalidWherePostComments', { body: 'hello world' })
          ).rejects.toThrowError(CannotPassUndefinedAsAValueToAWhereClause)
        })
      })

      context('whereNot clause has an undefined value', () => {
        it('raises an exception', async () => {
          const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
          const post = await user.createAssociation('posts')

          await expect(
            async () => await post.updateAssociation('invalidWhereNotPostComments', { body: 'hello world' })
          ).rejects.toThrowError(CannotPassUndefinedAsAValueToAWhereClause)
        })
      })
    })
  })

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
    it('updates the associated models', async () => {
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

    context('when a required and-clause isn’t passed', () => {
      it('throws MissingRequiredAssociationWhereClause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })

        await expect(
          (composition.updateAssociation as any)('requiredCurrentLocalizedText', {
            name: 'Name was updated',
          })
        ).rejects.toThrow(MissingRequiredAssociationAndClause)
      })
    })

    context('when a required and-clause is passed', () => {
      it('applies the and-clause to the association', async () => {
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
          'requiredCurrentLocalizedText',
          {
            name: 'Name was updated',
          },
          { and: { locale: 'es-ES' } }
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
    it('respects scopes on the associated model', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const pet1 = await Pet.create({ user, name: 'Aster', species: 'dog' })
      const pet2 = await Pet.create({ user, name: 'peta', species: 'dog' })
      await pet2.destroy()

      await user.updateAssociation('asterPet', { species: 'cat' })

      await pet1.reload()
      const reloadedPet2 = await Pet.removeAllDefaultScopes().find(pet2.id)

      expect(pet1.species).toEqual('cat')
      expect(reloadedPet2!.species).toEqual('dog')
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

  context('performing updateAssociation on an unpersisted model ', () => {
    it('throws CannotUpdateAssociationOnUnpersistedDream', async () => {
      const user = User.new()

      await expect(user.updateAssociation('pets', {})).rejects.toThrow(
        CannotUpdateAssociationOnUnpersistedDream
      )
    })

    context('in a transaction', () => {
      it('throws CannotUpdateAssociationOnUnpersistedDream', async () => {
        const user = User.new()

        await expect(
          ApplicationModel.transaction(async txn => await user.txn(txn).updateAssociation('pets', {}))
        ).rejects.toThrow(CannotUpdateAssociationOnUnpersistedDream)
      })
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', async () => {
    // @ts-expect-error intentionally passing invalid arg to test that type protection is working
    await User.new().updateAssociation('notARealAssociation')
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(async txn => {
        const user = User.new()
        // @ts-expect-error intentionally passing invalid arg to test that type protection is working
        await user.txn(txn).updateAssociation('notARealAssociation')
      })
    })
  })
})
