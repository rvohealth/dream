import { MockInstance } from 'vitest'
import Dream from '../../../../src/Dream.js'
import DreamTransaction from '../../../../src/dream/DreamTransaction.js'
import * as destroyAssociationModule from '../../../../src/dream/internal/associations/destroyAssociation.js'
import * as runHooksForModule from '../../../../src/dream/internal/runHooksFor.js'
import Query from '../../../../src/dream/Query.js'
import CannotDestroyAssociationOnUnpersistedDream from '../../../../src/errors/associations/CannotDestroyAssociationOnUnpersistedDream.js'
import MissingRequiredAssociationAndClause from '../../../../src/errors/associations/MissingRequiredAssociationAndClause.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Collar from '../../../../test-app/app/models/Collar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset.js'
import LocalizedText from '../../../../test-app/app/models/LocalizedText.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import Post from '../../../../test-app/app/models/Post.js'
import Rating from '../../../../test-app/app/models/Rating.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream#reallyDestroyAssociation', () => {
  let hooksSpy: MockInstance

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
    expect(hooksSpy).toHaveBeenCalledWith(
      'afterDestroyCommit',
      expect.toMatchDreamModel(dream),
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
    expect(hooksSpy).not.toHaveBeenCalledWith(
      'afterDestroyCommit',
      expect.toMatchDreamModel(dream),
      expect.toBeOneOf([expect.anything(), undefined, null]),
      expect.toBeOneOf([expect.anything(), undefined, null]),
      expect.toBeOneOf([expect.anything(), undefined, null])
    )
  }

  it('calls model hooks for each associated record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await user.createAssociation('compositions')
    const compositionAsset = await composition.createAssociation('compositionAssets')

    hooksSpy = vi.spyOn(runHooksForModule, 'default')

    await composition.reallyDestroyAssociation('compositionAssets')
    expectDestroyHooksCalled(compositionAsset)
  })

  context('cascade is false (it is true by default)', () => {
    it('skips cascade-destroying associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await user.createAssociation('compositions')
      await composition.createAssociation('compositionAssets')

      const reallyDestroySpy = vi.spyOn(Query.prototype, 'reallyDestroy')

      await composition.reallyDestroyAssociation('compositionAssets', { cascade: false })

      expect(reallyDestroySpy).toHaveBeenCalledWith(expect.objectContaining({ cascade: false }))
    })
  })

  context('model hooks', () => {
    it('calls model hooks for each associated record', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await user.createAssociation('compositions')
      const compositionAsset = await composition.createAssociation('compositionAssets')

      hooksSpy = vi.spyOn(runHooksForModule, 'default')

      await composition.reallyDestroyAssociation('compositionAssets')

      expectDestroyHooksCalled(compositionAsset)
    })

    context('when skipHooks is true', () => {
      it('does not call model hooks for each associated record', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await user.createAssociation('compositions')
        const compositionAsset = await composition.createAssociation('compositionAssets')

        hooksSpy = vi.spyOn(runHooksForModule, 'default')

        await composition.reallyDestroyAssociation('compositionAssets', { skipHooks: true })

        expectNoDestroyHooksCalled(compositionAsset)
      })

      context('with SoftDelete decorator', () => {
        it('calls model hooks for each associated record', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const post = await Post.create({ user })

          hooksSpy = vi.spyOn(runHooksForModule, 'default')

          await user.reallyDestroyAssociation('posts')

          expectDestroyHooksCalled(post)
        })

        it('bypasses SoftDelete for each associated record', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const post = await Post.create({ user })
          await Rating.create({ rateable: post, user })

          hooksSpy = vi.spyOn(runHooksForModule, 'default')

          await user.reallyDestroyAssociation('posts')

          expect(await Post.count()).toEqual(0)
          expect(await Rating.count()).toEqual(0)
          expect(await Rating.removeAllDefaultScopes().count()).toEqual(0)
        })

        context('skipHooks=true is passed', () => {
          it('does not call model hooks for each associated record', async () => {
            const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
            const pet = await Pet.create({ user })

            hooksSpy = vi.spyOn(runHooksForModule, 'default')

            await user.reallyDestroyAssociation('posts', { skipHooks: true })

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

      hooksSpy = vi.spyOn(runHooksForModule, 'default')

      await user.reallyDestroyAssociation('posts')

      expectDestroyHooksCalled(rating)
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
      await user.reallyDestroyAssociation('compositions')

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
        await user.reallyDestroyAssociation('petsFromUuid')

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
        await user.reallyDestroyAssociation('compositions', { and: { content: 'chalupas dujour' } })

        expect(await user.associationQuery('compositions').all()).toMatchDreamModels([composition2])
        expect(await Composition.all()).toMatchDreamModels([composition2])
      })
    })

    context('when a "requiredWhereClause" isn’t passed', () => {
      it('throws MissingRequiredAssociationWhereClause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })

        await expect((composition.destroyAssociation as any)('requiredCurrentLocalizedText')).rejects.toThrow(
          MissingRequiredAssociationAndClause
        )
      })
    })

    context('when a "requiredWhereClause" is passed', () => {
      it('destroys the record indicated by the where clause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        const localizedTextToKeep = await LocalizedText.create({ localizable: composition, locale: 'en-US' })
        const localizedTextToDestroy = await LocalizedText.create({
          localizable: composition,
          locale: 'es-ES',
        })

        await composition.reallyDestroyAssociation('requiredCurrentLocalizedText', {
          and: { locale: 'es-ES' },
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
      await user.reallyDestroyAssociation('compositionAssets', { and: { name: 'chalupas dujour' } })

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
        await user.reallyDestroyAssociation('collarsFromUuid')

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

      await user.reallyDestroyAssociation('userSettings')
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
        await user.reallyDestroyAssociation('firstPetFromUuid')

        expect(await user.associationQuery('firstPetFromUuid').all()).toEqual([])
        expect(await Pet.all()).toMatchDreamModels([pet2])
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

      await post.reallyDestroyAssociation('postVisibility')

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
        await user.txn(txn).reallyDestroyAssociation('compositions')
      })

      expect(await user.associationQuery('compositions').all()).toEqual([])
      expect(await Composition.all()).toMatchDreamModels([composition2])
    })

    context('with additional args', () => {
      it('passes those args along', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await user.createAssociation('compositions')

        const destroyAssociationSpy = vi.spyOn(destroyAssociationModule, 'default')

        await ApplicationModel.transaction(async txn => {
          await user.txn(txn).reallyDestroyAssociation('compositions', {
            bypassAllDefaultScopes: true,
            defaultScopesToBypass: ['hideDeleted'],
            cascade: false,
            skipHooks: false,
          })
        })

        expect(destroyAssociationSpy).toHaveBeenCalledWith(
          expect.toMatchDreamModel(user),
          expect.anything(),
          'compositions',
          {
            joinAndStatements: { and: undefined, andNot: undefined, andAny: undefined },
            bypassAllDefaultScopes: true,
            defaultScopesToBypass: ['hideDeleted', 'dream:SoftDelete'],
            cascade: false,
            reallyDestroy: true,
            skipHooks: false,
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
          await user.txn(txn).reallyDestroyAssociation('petsFromUuid')
        })

        expect(await user!.associationQuery('petsFromUuid').all()).toEqual([])
        expect(await Pet.all()).toMatchDreamModels([pet2])
      })
    })
  })

  context('performing reallyDestroyAssociation on an unpersisted model ', () => {
    it('throws CannotDestroyAssociationOnUnpersistedDream', async () => {
      const user = User.new()

      await expect(user.reallyDestroyAssociation('pets')).rejects.toThrow(
        CannotDestroyAssociationOnUnpersistedDream
      )
    })

    context('in a transaction', () => {
      it('throws CannotDestroyAssociationOnUnpersistedDream', async () => {
        const user = User.new()

        await expect(
          ApplicationModel.transaction(async txn => await user.txn(txn).reallyDestroyAssociation('pets'))
        ).rejects.toThrow(CannotDestroyAssociationOnUnpersistedDream)
      })
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', async () => {
    // @ts-expect-error intentionally passing invalid arg to test that type protection is working
    await User.new().reallyDestroyAssociation('notARealAssociation')
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(async txn => {
        const user = User.new()
        // @ts-expect-error intentionally passing invalid arg to test that type protection is working
        await user.txn(txn).reallyDestroyAssociation('notARealAssociation')
      })
    })
  })
})
