import { MockInstance } from 'vitest'
import { Dream, DreamTransaction } from '../../../src'
import * as destroyAssociatedRecordsModule from '../../../src/dream/internal/destroyAssociatedRecords'
import * as runHooksForModule from '../../../src/dream/internal/runHooksFor'
import * as safelyRunCommitHooksModule from '../../../src/dream/internal/safelyRunCommitHooks'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Collar from '../../../test-app/app/models/Collar'
import Composition from '../../../test-app/app/models/Composition'
import HeartRating from '../../../test-app/app/models/ExtraRating/HeartRating'
import LocalizedText from '../../../test-app/app/models/LocalizedText'
import Pet from '../../../test-app/app/models/Pet'
import Post from '../../../test-app/app/models/Post'
import PostVisibility from '../../../test-app/app/models/PostVisibility'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'

describe('Dream#destroy', () => {
  let hooksSpy: MockInstance
  let commitHooksSpy: MockInstance
  let cascadeSpy: MockInstance

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

  function expectNoCascadeDestroying(dream: Dream) {
    expect(cascadeSpy).not.toHaveBeenCalledWith(
      expect.toMatchDreamModel(dream),
      expect.anything(),
      expect.anything()
    )
  }

  it('destroys the record in question', async () => {
    const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
    const user2 = await User.create({ email: 'how@yadoin', name: 'howyadoin', password: 'hamz' })

    await user.destroy()
    expect(await User.count()).toEqual(1)
    expect(await User.first()).toMatchDreamModel(user2)
  })

  context('model hooks', () => {
    it('calls model hooks', async () => {
      const pet = await Pet.create()

      hooksSpy = vi.spyOn(runHooksForModule, 'default')
      commitHooksSpy = vi.spyOn(safelyRunCommitHooksModule, 'default')

      await pet.destroy()

      expectDestroyHooksCalled(pet)
    })

    context('skipHooks is passed', () => {
      it('skips model hooks', async () => {
        const pet = await Pet.create()

        hooksSpy = vi.spyOn(runHooksForModule, 'default')
        commitHooksSpy = vi.spyOn(safelyRunCommitHooksModule, 'default')

        await pet.destroy({ skipHooks: true })

        expectNoDestroyHooksCalled(pet)
      })
    })

    context('with SoftDelete decorator', () => {
      it('calls model hooks', async () => {
        const pet = await Pet.create()

        hooksSpy = vi.spyOn(runHooksForModule, 'default')
        commitHooksSpy = vi.spyOn(safelyRunCommitHooksModule, 'default')

        await pet.destroy()

        expectDestroyHooksCalled(pet)
      })

      context('skipHooks is passed', () => {
        it('skips model hooks', async () => {
          const pet = await Pet.create()

          hooksSpy = vi.spyOn(runHooksForModule, 'default')
          commitHooksSpy = vi.spyOn(safelyRunCommitHooksModule, 'default')

          await pet.destroy({ skipHooks: true })

          expectNoDestroyHooksCalled(pet)
        })
      })
    })
  })

  context('with a HasMany association with dependent: "destroy"', () => {
    let user: User
    let post: Post
    let heartRating: HeartRating
    let rating: Rating

    beforeEach(async () => {
      user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      post = await Post.create({ user })
      heartRating = await post.createAssociation('heartRatings', { user, rating: 1 })
      rating = await post.createAssociation('ratings', { user, rating: 1 })

      expect(await Rating.count()).toEqual(1)
      expect(await HeartRating.count()).toEqual(1)

      hooksSpy = vi.spyOn(runHooksForModule, 'default')
      commitHooksSpy = vi.spyOn(safelyRunCommitHooksModule, 'default')
    })

    it('cascade deletes all related HasMany associations, including deeply nested associations', async () => {
      expect(await User.count()).toEqual(1)
      expect(await Post.count()).toEqual(1)
      expect(await Rating.count()).toEqual(1)
      expect(await HeartRating.count()).toEqual(1)

      await user.destroy()

      expect(await User.count()).toEqual(0)
      expect(await Post.count()).toEqual(0)
      expect(await Rating.count()).toEqual(0)
      expect(await HeartRating.count()).toEqual(0)
    })

    context('with a SoftDelete model', () => {
      it('sets deletedAt to a datetime, does not delete record', async () => {
        expect(post.deletedAt).toBeNull()

        await post.destroy()

        expect(await Post.last()).toBeNull()
        const reloadedPost = await Post.removeAllDefaultScopes().last()
        expect(reloadedPost!.deletedAt).not.toBeNull()
      })

      it('cascade deletes all nested dependent-destroy associations on each associated model', async () => {
        const postVisibility = await PostVisibility.create()
        await post.createAssociation('postVisibility', postVisibility)

        expect(await PostVisibility.count()).toEqual(1)
        expect(await Post.count()).toEqual(1)
        expect(await Rating.count()).toEqual(1)
        expect(await HeartRating.count()).toEqual(1)

        await postVisibility.destroy()

        expect(await PostVisibility.count()).toEqual(0)
        expect(await Post.count()).toEqual(0)
        expect(await Rating.count()).toEqual(0)
        expect(await HeartRating.count()).toEqual(0)
      })

      it('calls callbacks for associations', async () => {
        const composition = await Composition.create({ user })
        await user.destroy()
        expectDestroyHooksCalled(composition)
      })

      context('with another, non-SoftDelete default scope on an associated model', () => {
        let pet: Pet
        let collar: Collar

        beforeEach(async () => {
          pet = await Pet.create({ name: 'Aster' })
          collar = await Collar.create({ pet, hidden: true })
        })

        it('applies default scopes to dependent: destroy associations', async () => {
          await pet.destroy()
          expect(await Collar.removeDefaultScope('hideHiddenCollars').all()).toMatchDreamModels([collar])
        })

        context('bypassAllDefaultScopes', () => {
          it('overrides all default scopes when querying dependent associations', async () => {
            await pet.destroy({ bypassAllDefaultScopes: true })
            expect(await Collar.removeDefaultScope('hideHiddenCollars').all()).toHaveLength(0)
          })
        })

        context('defaultScopesToBypass', () => {
          it('overrides specified default scopes when querying dependent associations', async () => {
            await pet.destroy({ defaultScopesToBypass: ['hideHiddenCollars'] })
            expect(await Collar.removeDefaultScope('hideHiddenCollars').all()).toHaveLength(0)
          })
        })
      })
    })

    context('when cascade delete is applied at the database level', () => {
      it('calls callbacks for associations', async () => {
        const composition = await Composition.create({ user })
        await user.destroy()
        expectDestroyHooksCalled(composition)
      })
    })

    context('when a deeply nested association fails to destroy', () => {
      beforeEach(() => {
        ;(Rating.prototype as any)['throwAnError'] = () => {
          throw new Error('howyadoin')
        }
        Rating['addHook']('afterDestroy', 'throwAnError' as any)
      })

      afterEach(() => {
        Rating['hooks'].afterDestroy.pop()
      })

      it('prevents destruction of model', async () => {
        const postVisibility = await PostVisibility.create()
        await post.createAssociation('postVisibility', postVisibility)

        expect(await PostVisibility.count()).toEqual(1)
        expect(await Post.count()).toEqual(1)
        expect(await Rating.count()).toEqual(1)
        expect(await HeartRating.count()).toEqual(1)

        await expect(async () => {
          await postVisibility.destroy()
        }).rejects.toThrow()

        expect(await PostVisibility.count()).toEqual(1)
        expect(await Post.count()).toEqual(1)
        expect(await Rating.count()).toEqual(1)
        expect(await HeartRating.count()).toEqual(1)
      })
    })

    it('does not delete polymorphic associations with different type field', async () => {
      const otherRating = await Rating.create({
        user,
        rateableType: 'Composition',
        rateableId: post.id,
      })

      expect(await Rating.all()).toMatchDreamModels([rating, otherRating])

      await post.destroy()

      expect(await Rating.all()).toMatchDreamModels([otherRating])
    })

    it('calls model hooks on each destroyed association', async () => {
      await post.destroy()
      expectDestroyHooksCalled(heartRating)
      expectDestroyHooksCalled(rating)
    })

    context('within a transaction', () => {
      it('applies the transaction to subsequent queries', async () => {
        try {
          await ApplicationModel.transaction(async txn => {
            await post.txn(txn).destroy()
            throw new Error('breaking out of transaction')
          })
        } catch {
          // noop
        }

        expect(await Rating.count()).toEqual(1)
        expect(await HeartRating.count()).toEqual(1)
      })

      context('with another, non-SoftDelete default scope on an associated model', () => {
        let pet: Pet
        let collar: Collar

        beforeEach(async () => {
          pet = await Pet.create({ name: 'Aster' })
          collar = await Collar.create({ pet, hidden: true })
        })

        it('applies default scopes to dependent: destroy associations', async () => {
          await ApplicationModel.transaction(async txn => {
            await pet.txn(txn).destroy()
          })
          expect(await Collar.removeDefaultScope('hideHiddenCollars').all()).toMatchDreamModels([collar])
        })

        context('bypassAllDefaultScopes', () => {
          it('overrides all default scopes when querying dependent associations', async () => {
            await ApplicationModel.transaction(async txn => {
              await pet.txn(txn).destroy({ bypassAllDefaultScopes: true })
            })
            expect(await Collar.removeDefaultScope('hideHiddenCollars').all()).toHaveLength(0)
          })
        })

        context('defaultScopesToBypass', () => {
          it('overrides specified default scopes when querying dependent associations', async () => {
            await ApplicationModel.transaction(async txn => {
              await pet.txn(txn).destroy({ defaultScopesToBypass: ['hideHiddenCollars'] })
            })
            expect(await Collar.removeDefaultScope('hideHiddenCollars').all()).toHaveLength(0)
          })
        })
      })
    })

    context('skipHooks=true', () => {
      it('does not call model hooks', async () => {
        await post.destroy({ skipHooks: true })

        const dreams = [heartRating, rating] as Dream[]

        dreams.forEach(dream => {
          expectNoDestroyHooksCalled(dream)
        })
      })
    })
  })

  context('with a HasOne association with dependent: "destroy"', () => {
    let composition: Composition
    let deletableLocalizedText: LocalizedText
    let nonDeletableLocalizedText: LocalizedText

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      composition = await Composition.create({ user })
      deletableLocalizedText = await composition.createAssociation('localizedTexts', {
        name: 'cascade delete me',
        locale: 'en-US',
      })
      nonDeletableLocalizedText = await composition.createAssociation('localizedTexts', {
        name: 'dont cascade delete me',
        locale: 'es-ES',
      })

      expect(await LocalizedText.count()).toEqual(2)

      hooksSpy = vi.spyOn(runHooksForModule, 'default')
      commitHooksSpy = vi.spyOn(safelyRunCommitHooksModule, 'default')
    })

    it('cascade deletes all related HasOne associations', async () => {
      await composition.destroy()
      expect(await LocalizedText.all()).toMatchDreamModels([nonDeletableLocalizedText])
    })

    it('calls model hooks on the destroyed association', async () => {
      await composition.destroy()
      expectDestroyHooksCalled(deletableLocalizedText)
    })

    context('skipHooks=true', () => {
      it('does not call association model hooks', async () => {
        await composition.destroy({ skipHooks: true })
        expectNoDestroyHooksCalled(deletableLocalizedText)
      })
    })
  })

  context('cascade is false (it is true by default)', () => {
    it('skips cascade-destroying associations', async () => {
      const pet = await Pet.create()

      cascadeSpy = vi.spyOn(destroyAssociatedRecordsModule, 'default')

      await pet.destroy({ cascade: false })

      expectNoCascadeDestroying(pet)
    })
  })

  context('when passed a transaction', () => {
    it('can destroy within the transaction', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      let beforeFailureCount = 1

      try {
        await ApplicationModel.transaction(async txn => {
          await user.txn(txn).destroy()
          beforeFailureCount = await User.txn(txn).count()
          throw new Error('throwing to kill transaction')
        })
      } catch {
        // noop
      }

      expect(beforeFailureCount).toEqual(0)
      expect(await User.count()).toEqual(1)
    })
  })
})
