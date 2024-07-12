import { Query } from '../../../src'
import * as destroyDreamModule from '../../../src/dream/internal/destroyDream'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Collar from '../../../test-app/app/models/Collar'
import Pet from '../../../test-app/app/models/Pet'
import Post from '../../../test-app/app/models/Post'
import PostComment from '../../../test-app/app/models/PostComment'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'

describe('Dream#reallyDestroy', () => {
  it('destroys the record', async () => {
    const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
    expect(await User.count()).toEqual(1)

    await user.reallyDestroy()
  })

  context('skipHooks passed', () => {
    it('passes along skipHooks to underlying destroyDream call', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const spy = jest.spyOn(destroyDreamModule, 'default')
      await user.reallyDestroy({ skipHooks: true })
      expect(spy).toHaveBeenCalledWith(user, null, expect.objectContaining({ skipHooks: true }))
    })
  })

  context('cascade passed', () => {
    it('passes along cascade to underlying destroyDream call', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const spy = jest.spyOn(destroyDreamModule, 'default')
      await user.reallyDestroy({ cascade: false })
      expect(spy).toHaveBeenCalledWith(user, null, expect.objectContaining({ cascade: false }))
    })
  })

  context('for a SoftDelete model', () => {
    it('bypasses soft delete pattern to really destroy the model', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const post = await Post.create({ user })

      expect(await Post.count()).toEqual(1)
      await post.reallyDestroy()

      expect(await Post.count()).toEqual(0)
      expect(await Post.removeAllDefaultScopes().count()).toEqual(0)
    })

    context('already soft-deleted asociations', () => {
      it('are really destroyed', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        const post = await Post.create({ user })
        const postComment = await PostComment.create({ post })

        await postComment.destroy()

        expect(await PostComment.removeAllDefaultScopes().count()).toEqual(1)
        await post.reallyDestroy()
        expect(await PostComment.removeAllDefaultScopes().count()).toEqual(0)
      })
    })

    context('with another, non-SoftDelete default scope on an associated model', () => {
      let pet: Pet
      let collar: Collar

      beforeEach(async () => {
        pet = await Pet.create({ name: 'Aster' })
        collar = await Collar.create({ pet, hidden: true })
      })

      it('applies default scopes to dependent: destroy associations', async () => {
        await pet.reallyDestroy()
        expect(await Collar.removeDefaultScope('hideHiddenCollars').all()).toMatchDreamModels([collar])
      })

      context('bypassAllDefaultScopes', () => {
        it('overrides all default scopes when querying dependent associations', async () => {
          await pet.reallyDestroy({ bypassAllDefaultScopes: true })
          expect(await Collar.removeAllDefaultScopes().all()).toHaveLength(0)
        })
      })

      context('defaultScopesToBypass', () => {
        it('overrides specified default scopes when querying dependent associations', async () => {
          await pet.reallyDestroy({ defaultScopesToBypass: ['hideHiddenCollars'] })
          expect(await Collar.removeAllDefaultScopes().all()).toHaveLength(0)
        })
      })
    })

    context('within a transaction', () => {
      it('applies transaction to query', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        const post = await Post.create({ user })
        await Rating.create({ rateable: post, user })

        expect(await Rating.count()).toEqual(1)

        try {
          await ApplicationModel.transaction(async txn => {
            await Post.query().txn(txn).reallyDestroy()
            throw new Error('testing transaction rollback')
          })
        } catch {
          // noop
        }

        expect(await Rating.count()).toEqual(1)
        expect(await Rating.removeAllDefaultScopes().count()).toEqual(1)

        await ApplicationModel.transaction(async txn => {
          await post.txn(txn).reallyDestroy()
        })

        expect(await Rating.count()).toEqual(0)
        expect(await Rating.removeAllDefaultScopes().count()).toEqual(0)
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
            await pet.txn(txn).reallyDestroy()
          })
          expect(await Collar.removeDefaultScope('hideHiddenCollars').all()).toMatchDreamModels([collar])
        })

        context('bypassAllDefaultScopes', () => {
          it('overrides all default scopes when querying dependent associations', async () => {
            await ApplicationModel.transaction(async txn => {
              await pet.txn(txn).reallyDestroy({ bypassAllDefaultScopes: true })
            })
            expect(await Collar.removeAllDefaultScopes().all()).toHaveLength(0)
          })
        })

        context('defaultScopesToBypass', () => {
          it('overrides specified default scopes when querying dependent associations', async () => {
            await ApplicationModel.transaction(async txn => {
              await pet.txn(txn).reallyDestroy({ defaultScopesToBypass: ['hideHiddenCollars'] })
            })
            expect(await Collar.removeAllDefaultScopes().all()).toHaveLength(0)
          })
        })
      })

      context('skipHooks=true', () => {
        it('passes skipHooks to underlying call', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const post = await Post.create({ user })

          const spy = jest.spyOn(Query.prototype, 'destroy')

          await ApplicationModel.transaction(async txn => {
            await post.txn(txn).reallyDestroy({ skipHooks: true })
          })

          expect(spy).toHaveBeenCalledWith(expect.objectContaining({ skipHooks: true }))
        })
      })
    })
  })
})
