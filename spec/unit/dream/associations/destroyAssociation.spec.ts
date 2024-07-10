import { DateTime } from 'luxon'
import { Dream, DreamTransaction, Query } from '../../../../src'
import * as destroyAssociationModule from '../../../../src/dream/internal/associations/destroyAssociation'
import * as runHooksForModule from '../../../../src/dream/internal/runHooksFor'
import * as safelyRunCommitHooksModule from '../../../../src/dream/internal/safelyRunCommitHooks'
import MissingRequiredAssociationWhereClause from '../../../../src/exceptions/associations/missing-required-association-where-clause'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel'
import Collar from '../../../../test-app/app/models/Collar'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import LocalizedText from '../../../../test-app/app/models/LocalizedText'
import Pet from '../../../../test-app/app/models/Pet'
import Post from '../../../../test-app/app/models/Post'
import Rating from '../../../../test-app/app/models/Rating'
import User from '../../../../test-app/app/models/User'

describe('Dream#destroyAssociation', () => {
  let hooksSpy: jest.SpyInstance
  let commitHooksSpy: jest.SpyInstance

  function expectDestroyHooksCalled(dream: Dream) {
    expect(hooksSpy).toHaveBeenCalledWith(
      'beforeDestroy',
      expect.toMatchDreamModel(dream),
      true,
      null,
      expect.any(DreamTransaction)
    )
    expect(hooksSpy).toHaveBeenCalledWith(
      'afterDestroy',
      expect.toMatchDreamModel(dream),
      true,
      null,
      expect.any(DreamTransaction)
    )
    expect(commitHooksSpy).toHaveBeenCalledWith(
      expect.toMatchDreamModel(dream),
      'afterDestroyCommit',
      true,
      null,
      expect.any(DreamTransaction)
    )
  }

  function expectNoDestroyHooksCalled(dream: Dream) {
    expect(hooksSpy).not.toHaveBeenCalledWith(
      'beforeDestroy',
      expect.toMatchDreamModel(dream),
      expect.toBeOneOf([expect.anything(), undefined, null]),
      expect.toBeOneOf([expect.anything(), undefined, null]),
      expect.toBeOneOf([expect.anything(), undefined, null])
    )
    expect(hooksSpy).not.toHaveBeenCalledWith(
      'afterDestroy',
      expect.toMatchDreamModel(dream),
      expect.toBeOneOf([expect.anything(), undefined, null]),
      expect.toBeOneOf([expect.anything(), undefined, null]),
      expect.toBeOneOf([expect.anything(), undefined, null])
    )
    expect(commitHooksSpy).not.toHaveBeenCalledWith(
      expect.toMatchDreamModel(dream),
      'afterDestroyCommit',
      expect.toBeOneOf([expect.anything(), undefined, null]),
      expect.toBeOneOf([expect.anything(), undefined, null]),
      expect.toBeOneOf([expect.anything(), undefined, null])
    )
  }

  context('cascade is false (it is true by default)', () => {
    it('skips cascade-destroying associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await user.createAssociation('compositions')
      await composition.createAssociation('compositionAssets')

      const destroySpy = jest.spyOn(Query.prototype, 'destroy')

      await composition.destroyAssociation('compositionAssets', { cascade: false })

      expect(destroySpy).toHaveBeenCalledWith(expect.objectContaining({ cascade: false }))
    })
  })

  context('model hooks', () => {
    it('calls model hooks for each associated record', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await user.createAssociation('compositions')
      const compositionAsset = await composition.createAssociation('compositionAssets')

      hooksSpy = jest.spyOn(runHooksForModule, 'default')
      commitHooksSpy = jest.spyOn(safelyRunCommitHooksModule, 'default')

      await composition.destroyAssociation('compositionAssets')

      expectDestroyHooksCalled(compositionAsset)
    })

    context('skipHooks=true', () => {
      it('does not call model hooks for each associated record', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await user.createAssociation('compositions')
        const compositionAsset = await composition.createAssociation('compositionAssets')

        hooksSpy = jest.spyOn(runHooksForModule, 'default')
        commitHooksSpy = jest.spyOn(safelyRunCommitHooksModule, 'default')

        await composition.destroyAssociation('compositionAssets', { skipHooks: true })

        expectNoDestroyHooksCalled(compositionAsset)
      })

      context('with SoftDelete decorator', () => {
        it('sets deletedAt to a datetime, does not delete record', async () => {
          const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
          const post = await Post.create({ user })
          expect(post.deletedAt).toBeNull()

          await user.destroyAssociation('posts')

          expect(await Post.last()).toBeNull()
          const reloadedPost = await Post.unscoped().last()
          expect(reloadedPost!.deletedAt).not.toBeNull()
        })

        it('calls model hooks for each associated record', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const post = await Post.create({ user })

          hooksSpy = jest.spyOn(runHooksForModule, 'default')
          commitHooksSpy = jest.spyOn(safelyRunCommitHooksModule, 'default')

          await user.destroyAssociation('posts')

          expectDestroyHooksCalled(post)
        })

        context('skipHooks=true is passed', () => {
          it('does not call model hooks for each associated record', async () => {
            const pet = await Pet.create()

            hooksSpy = jest.spyOn(runHooksForModule, 'default')
            commitHooksSpy = jest.spyOn(safelyRunCommitHooksModule, 'default')

            await pet.destroy({ skipHooks: true })

            expectNoDestroyHooksCalled(pet)
          })
        })
      })
    })
  })

  context('when the association has child associations that are dependent: "destroy"', () => {
    it('calls model hooks on the dependent associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const post = await Post.create({ user })
      const rating = await Rating.create({ rateable: post, user })

      hooksSpy = jest.spyOn(runHooksForModule, 'default')
      commitHooksSpy = jest.spyOn(safelyRunCommitHooksModule, 'default')

      await user.destroyAssociation('posts')

      expectDestroyHooksCalled(rating)
    })

    context('with SoftDelete enabled on the parent model', () => {
      it('cascade deletes all related HasMany associations, including deeply nested associations', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const post = await Post.create({ user })
        await Rating.create({ rateable: post, user })

        expect(await Rating.count()).toEqual(1)

        await post.destroyAssociation('ratings')

        expect(await Rating.count()).toEqual(0)
      })
    })

    context('with SoftDelete enabled on the associated models', () => {
      it('cascade deletes all related HasMany associations, including deeply nested associations', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const post = await Post.create({ user })
        await Rating.create({ rateable: post, user })

        expect(await Post.count()).toEqual(1)
        expect(await Rating.count()).toEqual(1)

        await user.destroyAssociation('posts')

        expect(await Post.count()).toEqual(0)
        expect(await Rating.count()).toEqual(0)
      })
    })
  })

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

    context('with a primary key override', () => {
      it('leverages the primary key override', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user2 = await User.create({ email: 'fredz@frewd', password: 'howyadoin' })
        const pet = await user.createAssociation('petsFromUuid')
        const pet2 = await user2.createAssociation('petsFromUuid')

        expect(await Pet.all()).toMatchDreamModels([pet, pet2])
        expect(await user.associationQuery('petsFromUuid').all()).toMatchDreamModels([pet])
        await user.destroyAssociation('petsFromUuid')

        expect(await user.associationQuery('petsFromUuid').all()).toEqual([])
        expect(await Pet.all()).toMatchDreamModels([pet2])
      })
    })

    context('with query options passed', () => {
      it('destroys the related association, respecting options', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await user.createAssociation('compositions', { content: 'chalupas dujour' })
        const composition2 = await user.createAssociation('compositions', { content: 'chips ahoy' })

        expect(await Composition.all()).toMatchDreamModels([composition, composition2])
        expect(await user.associationQuery('compositions').all()).toMatchDreamModels([
          composition,
          composition2,
        ])
        await user.destroyAssociation('compositions', { where: { content: 'chalupas dujour' } })

        expect(await user.associationQuery('compositions').all()).toMatchDreamModels([composition2])
        expect(await Composition.all()).toMatchDreamModels([composition2])
      })
    })

    context('when a required where clause isn’t passed', () => {
      it('throws MissingRequiredAssociationWhereClause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })

        await expect(
          (composition.destroyAssociation as any)('inlineWhereCurrentLocalizedText')
        ).rejects.toThrow(MissingRequiredAssociationWhereClause)
      })
    })

    context('when a required where clause is passed', () => {
      it('destroys the record indicated by the where clause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        const localizedTextToKeep = await LocalizedText.create({ localizable: composition, locale: 'en-US' })
        const localizedTextToDestroy = await LocalizedText.create({
          localizable: composition,
          locale: 'es-ES',
        })

        await composition.destroyAssociation('inlineWhereCurrentLocalizedText', {
          where: { locale: 'es-ES' },
        })

        expect(await LocalizedText.find(localizedTextToKeep.id)).toMatchDreamModel(localizedTextToKeep)
        expect(await LocalizedText.find(localizedTextToDestroy.id)).toBeNull()
      })
    })
  })

  context('with a HasMany through association', () => {
    it('destroys the related through association, respecting options', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await user.createAssociation('compositions', { content: '1' })
      const compositionAsset1 = await composition.createAssociation('compositionAssets', {
        name: 'chalupas dujour',
      })
      const compositionAsset2 = await composition.createAssociation('compositionAssets', {
        name: 'coolidge',
      })

      expect(await CompositionAsset.all()).toMatchDreamModels([compositionAsset1, compositionAsset2])
      expect(await user.associationQuery('compositionAssets').all()).toMatchDreamModels([
        compositionAsset1,
        compositionAsset2,
      ])
      await user.destroyAssociation('compositionAssets', { where: { name: 'chalupas dujour' } })

      expect(await user.associationQuery('compositionAssets').all()).toMatchDreamModels([compositionAsset2])
      expect(await CompositionAsset.all()).toMatchDreamModels([compositionAsset2])
    })

    context('with a primary key override', () => {
      it('leverages the primary key override', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user2 = await User.create({ email: 'fredz@frewd', password: 'howyadoin' })
        const pet = await user.createAssociation('petsFromUuid')
        const pet2 = await user2.createAssociation('petsFromUuid')
        const collar = await pet.createAssociation('collars')
        const collar2 = await pet2.createAssociation('collars')

        expect(await Collar.all()).toMatchDreamModels([collar, collar2])
        expect(await user.associationQuery('collarsFromUuid').all()).toMatchDreamModels([collar])
        await user.destroyAssociation('collarsFromUuid')

        expect(await user.associationQuery('collarsFromUuid').all()).toEqual([])
        expect(await Collar.all()).toMatchDreamModels([collar2])
      })
    })
  })

  context('with a HasOne association', () => {
    it('destroys the related association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const createdAt = DateTime.now().minus({ days: 1 })
      const userSettings = await user.createAssociation('userSettings', { createdAt: createdAt })
      expect(await user.associationQuery('userSettings').all()).toMatchDreamModels([userSettings])

      await user.destroyAssociation('userSettings')
      expect(await user.associationQuery('userSettings').all()).toEqual([])
    })

    context('with a primary key override', () => {
      it('leverages the primary key override', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user2 = await User.create({ email: 'fredz@frewd', password: 'howyadoin' })
        const pet = await user.createAssociation('firstPetFromUuid')
        const pet2 = await user2.createAssociation('firstPetFromUuid')

        expect(await Pet.all()).toMatchDreamModels([pet, pet2])
        expect(await user.associationQuery('firstPetFromUuid').all()).toMatchDreamModels([pet])
        await user.destroyAssociation('firstPetFromUuid')

        expect(await user.associationQuery('firstPetFromUuid').all()).toEqual([])
        expect(await Pet.all()).toMatchDreamModels([pet2])
      })
    })

    context('the association has order applied to it', () => {
      it('respects ascending order clause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition1 = await Composition.create({ user, content: '1' })
        const composition2 = await Composition.create({ user, content: '2' })

        expect(await user.associationQuery('firstComposition').first()).toMatchDreamModel(composition1)

        await user.destroyAssociation('firstComposition')
        expect(await Composition.count()).toEqual(1)

        expect(await user.associationQuery('firstComposition').first()).toMatchDreamModel(composition2)
      })

      it('respects descending order clause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition1 = await Composition.create({ user, content: '1' })
        const composition2 = await Composition.create({ user, content: '2' })

        expect(await user.associationQuery('lastComposition').first()).toMatchDreamModel(composition2)

        await user.destroyAssociation('lastComposition')
        expect(await Composition.count()).toEqual(1)

        expect(await user.associationQuery('lastComposition').first()).toMatchDreamModel(composition1)
      })
    })
  })

  context('with an optional BelongsTo association', () => {
    it('destroys the related association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const post = await Post.create({ user, body: 'howyadoin' })
      const createdAt = DateTime.now().minus({ days: 1 })
      const postVisibility = await post.createAssociation('postVisibility', { createdAt: createdAt })
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

      await ApplicationModel.transaction(async txn => {
        await user.txn(txn).destroyAssociation('compositions')
      })

      expect(await user.associationQuery('compositions').all()).toEqual([])
      expect(await Composition.all()).toMatchDreamModels([composition2])
    })

    context('with additional args', () => {
      it('passes those args along', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await user.createAssociation('compositions')

        const destroyAssociationSpy = jest.spyOn(destroyAssociationModule, 'default')

        await ApplicationModel.transaction(async txn => {
          await user.txn(txn).destroyAssociation('compositions', { skipHooks: false, cascade: false })
        })

        expect(destroyAssociationSpy).toHaveBeenCalledWith(
          expect.toMatchDreamModel(user),
          expect.anything(),
          'compositions',
          undefined,
          {
            skipHooks: false,
            cascade: false,
          }
        )
      })
    })

    context('with a primary key override', () => {
      it('leverages the primary key override', async () => {
        let user: User | undefined = undefined
        let user2: User | undefined = undefined
        let pet: Pet | undefined = undefined
        let pet2: Pet | undefined = undefined

        await ApplicationModel.transaction(async txn => {
          user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
          pet = await user.txn(txn).createAssociation('petsFromUuid')
          user2 = await User.txn(txn).create({ email: 'fredz@frewd', password: 'howyadoin' })
          pet2 = await user2.txn(txn).createAssociation('petsFromUuid')

          expect(await Pet.txn(txn).all()).toMatchDreamModels([pet, pet2])
          expect(await user.txn(txn).associationQuery('petsFromUuid').all()).toMatchDreamModels([pet])
          await user.txn(txn).destroyAssociation('petsFromUuid')
        })

        expect(await user!.associationQuery('petsFromUuid').all()).toEqual([])
        expect(await Pet.all()).toMatchDreamModels([pet2])
      })
    })
  })
})
