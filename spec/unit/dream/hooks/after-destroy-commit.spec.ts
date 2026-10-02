import Decorators from '../../../../src/decorators/Decorators.js'
import DreamTransaction from '../../../../src/dream/DreamTransaction.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset.js'
import Post from '../../../../test-app/app/models/Post.js'
import PostComment from '../../../../test-app/app/models/PostComment.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream AfterDestroyCommit decorator', () => {
  it('runs the query after the transactions have been commited', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user, content: 'howyadoin' })
    const compositionAsset = await CompositionAsset.create({
      composition,
      src: 'mark after destroy commit',
    })

    await compositionAsset.destroy()
    await composition.reload()

    expect(composition.content).toEqual('changed after destroy commit of composition asset')
  })

  context('destroying a record', () => {
    let compositionAsset: CompositionAsset

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      compositionAsset = await CompositionAsset.create({ composition })
    })

    it('calls the hook with no argument', async () => {
      const spy = vi.spyOn(CompositionAsset.prototype, 'updateCompositionContentAfterDestroyCommit')
      await compositionAsset.destroy()

      expect(spy).toHaveBeenCalledExactlyOnceWith()
    })

    context('in a transaction', () => {
      it('calls the hook with no argument', async () => {
        const spy = vi.spyOn(CompositionAsset.prototype, 'updateCompositionContentAfterDestroyCommit')
        await ApplicationModel.transaction(async txn => await compositionAsset.txn(txn).destroy())

        expect(spy).toHaveBeenCalledExactlyOnceWith()
      })

      it('lets the hook write after the transaction commits, and resolves the caller', async () => {
        vi.spyOn(CompositionAsset.prototype, 'updateCompositionContentAfterDestroyCommit').mockImplementation(
          async (...args: unknown[]) => {
            const txn = args[0] as DreamTransaction<any> | undefined
            const attributes = { email: 'written@by.hook', password: 'howyadoin' }
            if (txn) await User.txn(txn).create(attributes)
            else await User.create(attributes)
          }
        )

        await ApplicationModel.transaction(async txn => await compositionAsset.txn(txn).destroy())

        expect(await User.findBy({ email: 'written@by.hook' })).not.toBeNull()
      })
    })

    context('through Query#destroy', () => {
      it('calls the hook with no argument', async () => {
        const spy = vi.spyOn(CompositionAsset.prototype, 'updateCompositionContentAfterDestroyCommit')
        await CompositionAsset.where({ id: compositionAsset.id }).destroy()

        expect(spy).toHaveBeenCalledExactlyOnceWith()
      })
    })

    context('through a locked Query#destroy', () => {
      it('calls the hook with no argument', async () => {
        const spy = vi.spyOn(CompositionAsset.prototype, 'updateCompositionContentAfterDestroyCommit')
        await CompositionAsset.where({ id: compositionAsset.id }).destroy({ lock: true })

        expect(spy).toHaveBeenCalledExactlyOnceWith()
      })
    })
  })

  context('soft-deleting a record', () => {
    let post: Post
    let comment: PostComment

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      post = await Post.create({ user })
      comment = await PostComment.create({ post })
    })

    it('calls the hook with no argument', async () => {
      const spy = vi.spyOn(PostComment.prototype, 'afterDestroyCommitHook')
      await comment.destroy()

      expect(spy).toHaveBeenCalledExactlyOnceWith()
    })

    context('as a dependent of a destroyed record', () => {
      it('calls the hook with no argument', async () => {
        const spy = vi.spyOn(PostComment.prototype, 'afterDestroyCommitHook')
        await post.destroy()

        expect(spy).toHaveBeenCalledExactlyOnceWith()
      })
    })
  })

  context('the entire statement is wrapped in a transaction', () => {
    it('runs commit hooks after transaction commits', async () => {
      let composition: Composition | null = null
      await ApplicationModel.transaction(async txn => {
        const user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        composition = await Composition.txn(txn).create({ user, content: 'howyadoin' })
        const compositionAsset = await CompositionAsset.txn(txn).create({
          composition,
          src: 'mark after destroy commit',
        })

        await compositionAsset.txn(txn).destroy()
      })
      await composition!.reload()
      expect(composition!.content).toEqual('changed after destroy commit of composition asset')
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('rejects an AfterDestroyCommit method that declares a parameter', () => {
    const deco = new Decorators<typeof CompositionAssetWithParameterizedHooks>()
    class CompositionAssetWithParameterizedHooks extends CompositionAsset {
      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterDestroyCommit()
      public requiredParameter(txn: DreamTransaction<any>) {
        void txn
      }

      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterDestroyCommit()
      public optionalParameter(txn?: DreamTransaction<any>) {
        void txn
      }

      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterDestroyCommit()
      public defaultedParameter(txn: DreamTransaction<any> | null = null) {
        void txn
      }

      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterDestroyCommit()
      public restParameter(...args: unknown[]) {
        void args
      }

      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterDestroyCommit()
      public unionRestParameter(...args: [] | [DreamTransaction<any>]) {
        void args
      }
    }
    void CompositionAssetWithParameterizedHooks
  })

  it('accepts an AfterDestroyCommit method that declares no parameter', () => {
    const deco = new Decorators<typeof CompositionAssetWithCommitHooks>()
    class CompositionAssetWithCommitHooks extends CompositionAsset {
      @deco.AfterDestroyCommit()
      public noParameter() {}

      @deco.AfterDestroyCommit()
      public async asyncHook() {
        await Promise.resolve()
      }

      @deco.AfterDestroyCommit()
      public thisTyped(this: CompositionAssetWithCommitHooks) {
        void this.src
      }
    }
    void CompositionAssetWithCommitHooks
  })

  it('leaves AfterDestroyCommit on a placement other than an instance method unchecked', () => {
    const deco = new Decorators<typeof CompositionAssetWithOtherPlacements>()
    class CompositionAssetWithOtherPlacements extends CompositionAsset {
      @deco.AfterDestroyCommit()
      public arrowField = (txn?: DreamTransaction<any>) => {
        void txn
      }

      @deco.AfterDestroyCommit()
      public accessor accessorField = (txn?: DreamTransaction<any>) => {
        void txn
      }

      @deco.AfterDestroyCommit()
      public get getter() {
        return (txn: DreamTransaction<any>) => {
          void txn
        }
      }

      @deco.AfterDestroyCommit()
      public static staticMethod(txn: DreamTransaction<any>) {
        void txn
      }
    }
    void CompositionAssetWithOtherPlacements
  })
})
