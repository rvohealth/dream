import CannotCallUndestroyOnANonSoftDeleteModel from '../../../src/errors/CannotCallUndestroyOnANonSoftDeleteModel.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Collar from '../../../test-app/app/models/Collar.js'
import Pet from '../../../test-app/app/models/Pet.js'
import Post from '../../../test-app/app/models/Post.js'
import PostComment from '../../../test-app/app/models/PostComment.js'
import User from '../../../test-app/app/models/User.js'

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

  context('the record is not deleted', () => {
    it('is idempotent: a second undestroy leaves the sort scope contiguous', async () => {
      const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      const post1 = await Post.create({ user, body: 'a' })
      const post2 = await Post.create({ user, body: 'b' })
      const post3 = await Post.create({ user, body: 'c' })

      await post2.destroy()
      await post2.undestroy()
      await post2.undestroy()

      await post1.reload()
      await post2.reload()
      await post3.reload()

      expect([post1.position, post3.position, post2.position]).toEqual([1, 2, 3])
    })

    it('does not move a record that was never destroyed', async () => {
      const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      const post1 = await Post.create({ user, body: 'a' })
      const post2 = await Post.create({ user, body: 'b' })

      await post2.undestroy()

      await post1.reload()
      await post2.reload()

      expect([post1.position, post2.position]).toEqual([1, 2])
      expect(post2.deletedAt).toBeNull()
    })

    it('still cascades to child associations', async () => {
      const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      const post = await Post.create({ user, body: 'hello world' })
      const comment = await PostComment.create({ post })

      // Undestroy's idempotency guard is the `deletedAt is not null` condition
      // on the record's own restore, and its scope must be exactly that one
      // row: an undestroy whose own restore matches nothing still runs the
      // `dependent: 'destroy'` cascade, each child deciding against its own
      // row. The tempting implementation — return early when the record is not
      // deleted — would skip the cascade along with the restore.
      //
      // The four calls below construct the one state that can tell those two
      // apart. The first destroy/undestroy pair puts the post through a full
      // cascade cycle and leaves it live again, so the final call is a *repeat*
      // undestroy — the job-retry shape — rather than an undestroy of a
      // never-destroyed record, which the spec above already covers; it also
      // runs against an instance carrying the residue of an earlier pass
      // (consumed sortable snapshots, a reload) rather than a pristine one.
      // The direct `comment.destroy()` then re-deletes only the child: parent
      // live, child deleted. The final undestroy's own restore therefore
      // matches zero rows — the guard fires, no hooks run, no position moves —
      // and the restored comment the assertion finds is attributable only to
      // its cascade. The first pair also proves the comment survives a cascade
      // round trip before being re-deleted, so a green assertion cannot mean
      // the comment was simply never deleted.
      await post.destroy()
      await post.undestroy()
      await comment.destroy()
      await post.undestroy()

      expect(await PostComment.all()).toMatchDreamModels([comment])
    })
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
