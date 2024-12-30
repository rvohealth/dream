import CannotCallUndestroyOnANonSoftDeleteModel from '../../../src/errors/CannotCallUndestroyOnANonSoftDeleteModel'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Collar from '../../../test-app/app/models/Collar'
import Pet from '../../../test-app/app/models/Pet'
import Post from '../../../test-app/app/models/Post'
import PostComment from '../../../test-app/app/models/PostComment'
import User from '../../../test-app/app/models/User'

describe('Dream#undestroy', () => {
  it('undestroys a soft-deleted record', async () => {
    const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
    const post = await Post.create({ user, body: 'hello world' })

    await post.destroy()

    expect(await Post.count()).toEqual(0)
    expect(await Post.removeAllDefaultScopes().count()).toEqual(1)

    const res = await post.undestroy()
    expect(res).toMatchDreamModel(post)
    expect(res.deletedAt).toBeNull()

    expect(await Post.all()).toMatchDreamModels([post])
  })

  context('without cascade: true passed', () => {
    it('undestroys child associations which are marked "dependent: `destroy`"', async () => {
      const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      const post = await Post.create({ user, body: 'hello world' })
      const comment = await PostComment.create({ post })

      await post.destroy()

      expect(await PostComment.all()).toHaveLength(0)
      expect(await PostComment.removeAllDefaultScopes().count()).toEqual(1)

      await post.undestroy()

      expect(await PostComment.all()).toMatchDreamModels([comment])
    })

    context('with a non-SoftDelete default scope on an associated model', () => {
      let pet: Pet
      let collar: Collar

      beforeEach(async () => {
        pet = await Pet.create({ name: 'Aster' })
        collar = await Collar.create({ pet, hidden: true })
      })

      it('applies default scopes to dependent: destroy associations', async () => {
        await pet.destroy({ bypassAllDefaultScopes: true })
        await pet.undestroy()
        expect(await Collar.removeDefaultScope('hideHiddenCollars').all()).toHaveLength(0)
      })

      context('bypassAllDefaultScopes', () => {
        it('overrides all default scopes when querying dependent associations', async () => {
          await pet.destroy({ bypassAllDefaultScopes: true })
          await pet.undestroy({ bypassAllDefaultScopes: true })
          expect(await Collar.removeDefaultScope('hideHiddenCollars').all()).toMatchDreamModels([collar])
        })
      })

      context('defaultScopesToBypass', () => {
        it('overrides specified default scopes when querying dependent associations', async () => {
          await pet.destroy({ bypassAllDefaultScopes: true })
          await pet.undestroy({ defaultScopesToBypass: ['hideHiddenCollars'] })
          expect(await Collar.removeDefaultScope('hideHiddenCollars').all()).toMatchDreamModels([collar])
        })
      })
    })

    context('within a transaction', () => {
      context('with a non-SoftDelete default scope on an associated model', () => {
        let pet: Pet
        let collar: Collar

        beforeEach(async () => {
          pet = await Pet.create({ name: 'Aster' })
          collar = await Collar.create({ pet, hidden: true })
        })

        it('applies default scopes to dependent: destroy associations', async () => {
          await pet.destroy({ bypassAllDefaultScopes: true })
          await ApplicationModel.transaction(async txn => {
            await pet.txn(txn).undestroy()
          })
          expect(await Collar.removeDefaultScope('hideHiddenCollars').all()).toHaveLength(0)
        })

        context('bypassAllDefaultScopes', () => {
          it('overrides all default scopes when querying dependent associations', async () => {
            await pet.destroy({ bypassAllDefaultScopes: true })
            await ApplicationModel.transaction(async txn => {
              await pet.txn(txn).undestroy({ bypassAllDefaultScopes: true })
            })
            expect(await Collar.removeDefaultScope('hideHiddenCollars').all()).toMatchDreamModels([collar])
          })
        })

        context('defaultScopesToBypass', () => {
          it('overrides specified default scopes when querying dependent associations', async () => {
            await pet.destroy({ bypassAllDefaultScopes: true })
            await ApplicationModel.transaction(async txn => {
              await pet.txn(txn).undestroy({ defaultScopesToBypass: ['hideHiddenCollars'] })
            })
            expect(await Collar.removeDefaultScope('hideHiddenCollars').all()).toMatchDreamModels([collar])
          })
        })
      })
    })
  })

  context('with cascade: false passed', () => {
    it('does not undestroy child associations which are marked "dependent: `destroy`"', async () => {
      const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      const post = await Post.create({ user, body: 'hello world' })
      await PostComment.create({ post })

      await post.destroy()

      expect(await PostComment.count()).toEqual(0)
      expect(await PostComment.removeAllDefaultScopes().count()).toEqual(1)

      await post.undestroy({ cascade: false })

      expect(await PostComment.count()).toEqual(0)
      expect(await PostComment.removeAllDefaultScopes().count()).toEqual(1)
    })
  })

  context('the record is not a SoftDelete record', () => {
    it('raises an exception', async () => {
      const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      await expect(async () => await user.undestroy()).rejects.toThrow(
        CannotCallUndestroyOnANonSoftDeleteModel
      )
    })
  })
})
