import Decorators from '../../../../src/decorators/Decorators.js'
import DreamTransaction from '../../../../src/dream/DreamTransaction.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import Post from '../../../../test-app/app/models/Post.js'
import PostComment from '../../../../test-app/app/models/PostComment.js'
import Sandbag from '../../../../test-app/app/models/Sandbag.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream AfterUpdateCommit decorator', () => {
  it('runs the query after the transactions have been commited', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

    const composition = await Composition.create({
      userId: user.id,
    })
    await composition.update({
      content: 'change me after update commit',
    })
    expect(composition.content).toEqual('changed after update commit')
  })

  it('calls the hook with no argument', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    const spy = vi.spyOn(Composition.prototype, 'conditionallyChangeContentOnUpdateCommit')
    await composition.update({ content: 'updated' })

    expect(spy).toHaveBeenCalledExactlyOnceWith()
  })

  context('the entire statement is wrapped in a transaction', () => {
    it('runs commit hooks after transaction commits', async () => {
      let composition: Composition | null = null
      await ApplicationModel.transaction(async txn => {
        const user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })

        composition = await Composition.txn(txn).create({ userId: user.id })
        await composition.txn(txn).update({
          content: 'change me after update commit',
        })
      })
      expect(composition!.content).toEqual('changed after update commit')
    })

    it('calls the hook with no argument', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const spy = vi.spyOn(Composition.prototype, 'conditionallyChangeContentOnUpdateCommit')
      await ApplicationModel.transaction(
        async txn => await composition.txn(txn).update({ content: 'updated' })
      )

      expect(spy).toHaveBeenCalledExactlyOnceWith()
    })
  })

  context('updating through a locked Query#update', () => {
    it('calls the hook with no argument', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const spy = vi.spyOn(Composition.prototype, 'conditionallyChangeContentOnUpdateCommit')
      await Composition.where({ id: composition.id }).update({ content: 'updated' }, { lock: true })

      expect(spy).toHaveBeenCalledExactlyOnceWith()
    })
  })

  context('undestroying a soft-deleted record', () => {
    let post: Post
    let comment: PostComment

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      post = await Post.create({ user })
      comment = await PostComment.create({ post })
    })

    it('calls the hook with no argument', async () => {
      await comment.destroy()
      const spy = vi.spyOn(PostComment.prototype, 'afterUpdateCommitHook')
      await comment.undestroy()

      expect(spy).toHaveBeenCalledExactlyOnceWith()
    })

    context('through Query#undestroy', () => {
      it('calls the hook with no argument', async () => {
        await comment.destroy()
        const spy = vi.spyOn(PostComment.prototype, 'afterUpdateCommitHook')
        await PostComment.where({ id: comment.id }).undestroy()

        expect(spy).toHaveBeenCalledExactlyOnceWith()
      })
    })

    context('as a dependent of an undestroyed record', () => {
      it('calls the hook with no argument', async () => {
        await post.destroy()
        const spy = vi.spyOn(PostComment.prototype, 'afterUpdateCommitHook')
        await post.undestroy()

        expect(spy).toHaveBeenCalledExactlyOnceWith()
      })
    })
  })

  context('with ifChanging set on hook decorator', () => {
    let sandbag: Sandbag

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })
      sandbag = await mylar.createAssociation('sandbags', { weightTons: 10 })
    })

    context('one of the attributes specified in the "ifChanging" clause is changing', () => {
      it('calls the hook with no argument', async () => {
        const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterUpdateCommitHook')
        await sandbag.update({ weightTons: 11 })

        expect(spy).toHaveBeenCalledExactlyOnceWith()
      })

      context('in a transaction', () => {
        it('calls the hook with no argument', async () => {
          const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterUpdateCommitHook')
          await ApplicationModel.transaction(async txn => await sandbag.txn(txn).update({ weightTons: 11 }))

          expect(spy).toHaveBeenCalledExactlyOnceWith()
        })
      })
    })

    context('none of the attributes specified in the "ifChanging" clause are changing', () => {
      it('does not call the hook', async () => {
        await sandbag.update({ weightTons: null })
        const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterUpdateCommitHook')
        await sandbag.update({ weightKgs: 120 })

        expect(spy).not.toHaveBeenCalled()
      })

      context('in a transaction', () => {
        it('does not call the hook', async () => {
          await sandbag.update({ weightTons: null })
          const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterUpdateCommitHook')

          await ApplicationModel.transaction(async txn => await sandbag.txn(txn).update({ weightKgs: 120 }))

          expect(spy).not.toHaveBeenCalled()
        })
      })
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('rejects an AfterUpdateCommit method that declares a parameter', () => {
    const deco = new Decorators<typeof CompositionWithParameterizedHooks>()
    class CompositionWithParameterizedHooks extends Composition {
      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterUpdateCommit()
      public requiredParameter(txn: DreamTransaction<any>) {
        void txn
      }

      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterUpdateCommit()
      public optionalParameter(txn?: DreamTransaction<any>) {
        void txn
      }

      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterUpdateCommit()
      public defaultedParameter(txn: DreamTransaction<any> | null = null) {
        void txn
      }

      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterUpdateCommit()
      public restParameter(...args: unknown[]) {
        void args
      }

      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterUpdateCommit()
      public unionRestParameter(...args: [] | [DreamTransaction<any>]) {
        void args
      }
    }
    void CompositionWithParameterizedHooks
  })

  it('rejects an ifChanged that names a non-column', () => {
    const deco = new Decorators<typeof CompositionWithBadIfChanged>()
    class CompositionWithBadIfChanged extends Composition {
      // @ts-expect-error ifChanged accepts only the model's columns
      @deco.AfterUpdateCommit({ ifChanged: ['notAColumn'] })
      public hook() {}
    }
    void CompositionWithBadIfChanged
  })

  it('accepts an AfterUpdateCommit method that declares no parameter', () => {
    const deco = new Decorators<typeof CompositionWithCommitHooks>()
    class CompositionWithCommitHooks extends Composition {
      @deco.AfterUpdateCommit()
      public noParameter() {}

      @deco.AfterUpdateCommit()
      public async asyncHook() {
        await Promise.resolve()
      }

      @deco.AfterUpdateCommit()
      public thisTyped(this: CompositionWithCommitHooks) {
        void this.content
      }

      @deco.AfterUpdateCommit({ ifChanged: ['content'] })
      public withIfChanged() {}
    }
    void CompositionWithCommitHooks
  })

  it('leaves AfterUpdateCommit on a placement other than an instance method unchecked', () => {
    const deco = new Decorators<typeof CompositionWithOtherPlacements>()
    class CompositionWithOtherPlacements extends Composition {
      @deco.AfterUpdateCommit()
      public arrowField = (txn?: DreamTransaction<any>) => {
        void txn
      }

      @deco.AfterUpdateCommit()
      public accessor accessorField = (txn?: DreamTransaction<any>) => {
        void txn
      }

      @deco.AfterUpdateCommit()
      public get getter() {
        return (txn: DreamTransaction<any>) => {
          void txn
        }
      }

      @deco.AfterUpdateCommit()
      public static staticMethod(txn: DreamTransaction<any>) {
        void txn
      }
    }
    void CompositionWithOtherPlacements
  })
})
