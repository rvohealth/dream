import { Dream, DreamTransaction } from '../../../src'
import DreamDbConnection from '../../../src/db/dream-db-connection'
import ReplicaSafe from '../../../src/decorators/replica-safe'
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

describe('Query#destroy', () => {
  it('destroys all records matching the query', async () => {
    await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
    await User.create({ email: 'how@yadoin', name: 'howyadoin', password: 'hamz' })
    const user3 = await User.create({ email: 'fish@yadoin', name: 'cheese', password: 'hamz' })

    await User.where({ name: 'howyadoin' }).destroy()

    expect(await User.count()).toEqual(1)
    expect(await User.first()).toMatchDreamModel(user3)
  })

  it('calls model hooks', async () => {
    const pet = await Pet.create()
    await Pet.query().destroy()

    await pet.reload()
    expect(pet.deletedAt).not.toBeNull()
    expect(await Pet.count()).toEqual(0)
    expect(await Pet.unscoped().count()).toEqual(1)
  })

  context('skipHooks is passed', () => {
    it('skips model hooks', async () => {
      await Pet.create()
      await Pet.query().destroy({ skipHooks: true })

      const count = await Pet.unscoped().count()
      expect(count).toEqual(0)
    })
  })

  context('with a HasMany association with cascade: "destroy"', () => {
    let user: User
    let post: Post
    let hooksSpy: jest.SpyInstance
    let commitHooksSpy: jest.SpyInstance
    let heartRating: HeartRating
    let rating: Rating

    beforeEach(async () => {
      user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      post = await Post.create({ user })
      heartRating = await post.createAssociation('heartRatings', { user, rating: 1 })
      rating = await post.createAssociation('ratings', { user, rating: 1 })

      expect(await Rating.count()).toEqual(1)
      expect(await HeartRating.count()).toEqual(1)

      hooksSpy = jest.spyOn(runHooksForModule, 'default')
      commitHooksSpy = jest.spyOn(safelyRunCommitHooksModule, 'default')
    })

    it('cascade deletes all related HasMany associations', async () => {
      await Post.query().destroy()

      expect(await Rating.count()).toEqual(0)
      expect(await HeartRating.count()).toEqual(0)
    })

    it('cascade deletes all nested cascade-delete associations on each associated model', async () => {
      const postVisibility = await PostVisibility.create()
      await post.createAssociation('postVisibility', postVisibility)

      expect(await PostVisibility.count()).toEqual(1)
      expect(await Post.count()).toEqual(1)
      expect(await Rating.count()).toEqual(1)
      expect(await HeartRating.count()).toEqual(1)

      await PostVisibility.query().destroy()

      expect(await PostVisibility.count()).toEqual(0)
      expect(await Post.count()).toEqual(0)
      expect(await Rating.count()).toEqual(0)
      expect(await HeartRating.count()).toEqual(0)
    })

    context('when cascade delete is applied at the database level', () => {
      it('calls callbacks for associations', async () => {
        const composition = await Composition.create({ user })

        await User.query().destroy()

        expect(hooksSpy).toHaveBeenCalledWith(
          'beforeDestroy',
          expect.toMatchDreamModel(composition),
          true,
          null,
          expect.any(DreamTransaction)
        )
        expect(hooksSpy).toHaveBeenCalledWith(
          'afterDestroy',
          expect.toMatchDreamModel(composition),
          true,
          null,
          expect.any(DreamTransaction)
        )
        expect(commitHooksSpy).toHaveBeenCalledWith(
          expect.toMatchDreamModel(composition),
          'afterDestroyCommit',
          true,
          null,
          expect.any(DreamTransaction)
        )
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
          await PostVisibility.query().destroy()
        }).rejects.toThrow()

        expect(await PostVisibility.count()).toEqual(1)
        expect(await Post.count()).toEqual(1)
        expect(await Rating.count()).toEqual(1)
        expect(await HeartRating.count()).toEqual(1)
      })
    })

    it('calls model hooks on each destroyed association', async () => {
      await Post.query().destroy()
      const dreams = [heartRating, rating] as Dream[]

      dreams.forEach(dream => {
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
      })
    })

    context('within a transaction', () => {
      it('applies the transaction to subsequent queries', async () => {
        try {
          await ApplicationModel.transaction(async txn => {
            await Post.query().txn(txn).destroy()
            throw new Error('breaking out of transaction')
          })
        } catch {
          // noop
        }

        expect(await Rating.count()).toEqual(1)
        expect(await HeartRating.count()).toEqual(1)
      })
    })

    context('skipHooks=true', () => {
      it('does not call model hooks', async () => {
        await Post.query().destroy({ skipHooks: true })

        const dreams = [heartRating, rating] as Dream[]

        dreams.forEach(dream => {
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
        })
      })

      context('with cascade defined on one or more of this model’s associations', () => {
        it('the associated models are deleted', async () => {
          const postVisibility = await PostVisibility.create()
          await post.createAssociation('postVisibility', postVisibility)

          expect(await PostVisibility.count()).toEqual(1)
          expect(await Post.count()).toEqual(1)
          expect(await Rating.count()).toEqual(1)
          expect(await HeartRating.count()).toEqual(1)

          await PostVisibility.query().destroy({ skipHooks: true })

          expect(await PostVisibility.count()).toEqual(0)
          expect(await Post.count()).toEqual(0)
          expect(await Rating.count()).toEqual(0)
          expect(await HeartRating.count()).toEqual(0)
        })
      })

      context('with cascade defined only at the DB level', () => {
        it('the associated models are deleted', async () => {
          const pet = await Pet.create()
          await Collar.create({ pet })

          await Pet.query().destroy({ skipHooks: true })

          expect(await Pet.count()).toEqual(0)
          expect(await Collar.count()).toEqual(0)
        })
      })
    })
  })

  context('with a HasOne association with cascade: "destroy"', () => {
    let composition: Composition
    let hooksSpy: jest.SpyInstance
    let commitHooksSpy: jest.SpyInstance
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

      hooksSpy = jest.spyOn(runHooksForModule, 'default')
      commitHooksSpy = jest.spyOn(safelyRunCommitHooksModule, 'default')
    })

    it('cascade deletes all related HasOne associations', async () => {
      await Composition.query().destroy()

      expect(await LocalizedText.all()).toMatchDreamModels([nonDeletableLocalizedText])
    })

    it('calls model hooks on the destroyed association', async () => {
      await Composition.query().destroy()

      expect(hooksSpy).toHaveBeenCalledWith(
        'beforeDestroy',
        expect.toMatchDreamModel(deletableLocalizedText),
        true,
        null,
        expect.any(DreamTransaction)
      )
      expect(hooksSpy).toHaveBeenCalledWith(
        'afterDestroy',
        expect.toMatchDreamModel(deletableLocalizedText),
        true,
        null,
        expect.any(DreamTransaction)
      )
      expect(commitHooksSpy).toHaveBeenCalledWith(
        expect.toMatchDreamModel(deletableLocalizedText),
        'afterDestroyCommit',
        true,
        null,
        expect.any(DreamTransaction)
      )
    })

    context('skipHooks=true', () => {
      it('does not call association model hooks', async () => {
        await Composition.query().destroy({ skipHooks: true })

        expect(hooksSpy).not.toHaveBeenCalledWith(
          'beforeDestroy',
          expect.toMatchDreamModel(deletableLocalizedText),
          expect.toBeOneOf([expect.anything(), undefined, null]),
          expect.toBeOneOf([expect.anything(), undefined, null]),
          expect.toBeOneOf([expect.anything(), undefined, null])
        )
        expect(hooksSpy).not.toHaveBeenCalledWith(
          'afterDestroy',
          expect.toMatchDreamModel(deletableLocalizedText),
          expect.toBeOneOf([expect.anything(), undefined, null]),
          expect.toBeOneOf([expect.anything(), undefined, null]),
          expect.toBeOneOf([expect.anything(), undefined, null])
        )
        expect(commitHooksSpy).not.toHaveBeenCalledWith(
          expect.toMatchDreamModel(deletableLocalizedText),
          'afterDestroyCommit',
          expect.toBeOneOf([expect.anything(), undefined, null]),
          expect.toBeOneOf([expect.anything(), undefined, null]),
          expect.toBeOneOf([expect.anything(), undefined, null])
        )
      })
    })
  })

  context('regarding connections', () => {
    beforeEach(async () => {
      await User.create({ email: 'fred@fred', password: 'howyadoin' })

      jest.spyOn(DreamDbConnection, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.where({ email: 'fred@fred' }).destroy()

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary', expect.objectContaining({}))
    })

    context('with replica connection specified', () => {
      @ReplicaSafe()
      class CustomUser extends User {}

      it('uses the primary connection', async () => {
        await CustomUser.where({ email: 'fred@fred' }).destroy()

        // should always call to primary for update, regardless of replica-safe status
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary', expect.objectContaining({}))
      })
    })
  })
})
