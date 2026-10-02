import Decorators from '../../../../src/decorators/Decorators.js'
import DreamTransaction from '../../../../src/dream/DreamTransaction.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset.js'
import Sandbag from '../../../../test-app/app/models/Sandbag.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream AfterCreateCommit decorator', () => {
  it('runs the query after the transactions have been commited', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

    const composition = await Composition.create({
      userId: user.id,
      content: 'change me after create commit',
    })
    expect(composition.content).toEqual('changed after create commit')
  })

  it('calls the hook with no argument', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const spy = vi.spyOn(Composition.prototype, 'conditionallyChangeContentOnCreateCommit')
    await Composition.create({ user })

    expect(spy).toHaveBeenCalledExactlyOnceWith()
  })

  context('the entire statement is wrapped in a transaction', () => {
    it('runs commit hooks after transaction commits', async () => {
      let composition: Composition | null = null
      await ApplicationModel.transaction(async txn => {
        const user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        composition = await Composition.txn(txn).create({ user, content: 'change me after create commit' })
      })
      expect(composition!.content).toEqual('changed after create commit')
    })

    it('calls the hook with no argument', async () => {
      const spy = vi.spyOn(Composition.prototype, 'conditionallyChangeContentOnCreateCommit')
      await ApplicationModel.transaction(async txn => {
        const user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.txn(txn).create({ user })
      })

      expect(spy).toHaveBeenCalledExactlyOnceWith()
    })
  })

  context('creating through a BelongsTo association', () => {
    it('calls the hook with no argument', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const compositionAsset = await CompositionAsset.create({ composition })
      const spy = vi.spyOn(Composition.prototype, 'conditionallyChangeContentOnCreateCommit')

      await compositionAsset.createAssociation('composition', { user })

      expect(spy).toHaveBeenCalledExactlyOnceWith()
    })
  })

  context('with ifChanging set on hook decorator', () => {
    let mylar: Mylar

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      mylar = await Mylar.create({ user, color: 'red' })
    })

    context('one of the attributes specified in the "ifChanging" clause is changing to non-null', () => {
      it('calls the hook with no argument', async () => {
        const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterCreateCommitHook')
        await mylar.createAssociation('sandbags', { weightKgs: 10 })

        expect(spy).toHaveBeenCalledExactlyOnceWith()
      })

      context('in a transaction', () => {
        it('calls the hook with no argument', async () => {
          const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterCreateCommitHook')
          await ApplicationModel.transaction(
            async txn => await mylar.txn(txn).createAssociation('sandbags', { weightKgs: 10 })
          )

          expect(spy).toHaveBeenCalledExactlyOnceWith()
        })
      })
    })

    context('none of the attributes specified in the "ifChanging" clause are changing', () => {
      it('does not call the hook', async () => {
        const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterCreateCommitHook')
        await mylar.createAssociation('sandbags', { weight: 10 })

        expect(spy).not.toHaveBeenCalled()
      })

      context('in a transaction', () => {
        it('does not call the hook', async () => {
          const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterCreateCommitHook')
          await ApplicationModel.transaction(
            async txn => await mylar.txn(txn).createAssociation('sandbags', { weight: 10 })
          )

          expect(spy).not.toHaveBeenCalled()
        })
      })
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('rejects an AfterCreateCommit method that declares a parameter', () => {
    const deco = new Decorators<typeof CompositionWithParameterizedHooks>()
    class CompositionWithParameterizedHooks extends Composition {
      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterCreateCommit()
      public requiredParameter(txn: DreamTransaction<any>) {
        void txn
      }

      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterCreateCommit()
      public optionalParameter(txn?: DreamTransaction<any>) {
        void txn
      }

      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterCreateCommit()
      public defaultedParameter(txn: DreamTransaction<any> | null = null) {
        void txn
      }

      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterCreateCommit()
      public restParameter(...args: unknown[]) {
        void args
      }
    }
    void CompositionWithParameterizedHooks
  })

  it('rejects an ifChanged that names a non-column', () => {
    const deco = new Decorators<typeof CompositionWithBadIfChanged>()
    class CompositionWithBadIfChanged extends Composition {
      // @ts-expect-error ifChanged accepts only the model's columns
      @deco.AfterCreateCommit({ ifChanged: ['notAColumn'] })
      public hook() {}
    }
    void CompositionWithBadIfChanged
  })

  it('accepts an AfterCreateCommit method that declares no parameter', () => {
    const deco = new Decorators<typeof CompositionWithCommitHooks>()
    class CompositionWithCommitHooks extends Composition {
      @deco.AfterCreateCommit()
      public noParameter() {}

      @deco.AfterCreateCommit()
      public async asyncHook() {
        await Promise.resolve()
      }

      @deco.AfterCreateCommit()
      public thisTyped(this: CompositionWithCommitHooks) {
        void this.content
      }

      @deco.AfterCreateCommit({ ifChanged: ['content'] })
      public withIfChanged() {}
    }
    void CompositionWithCommitHooks
  })

  it('leaves AfterCreateCommit on a placement other than an instance method unchecked', () => {
    const deco = new Decorators<typeof CompositionWithOtherPlacements>()
    class CompositionWithOtherPlacements extends Composition {
      @deco.AfterCreateCommit()
      public arrowField = (txn?: DreamTransaction<any>) => {
        void txn
      }

      @deco.AfterCreateCommit()
      public accessor accessorField = (txn?: DreamTransaction<any>) => {
        void txn
      }

      @deco.AfterCreateCommit()
      public get getter() {
        return (txn: DreamTransaction<any>) => {
          void txn
        }
      }

      @deco.AfterCreateCommit()
      public static staticMethod(txn: DreamTransaction<any>) {
        void txn
      }
    }
    void CompositionWithOtherPlacements
  })
})
