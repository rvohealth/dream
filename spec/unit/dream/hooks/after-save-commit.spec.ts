import Decorators from '../../../../src/decorators/Decorators.js'
import DreamTransaction from '../../../../src/dream/DreamTransaction.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import ModelWithDateTimeConditionalHooks from '../../../../test-app/app/models/ModelWithDateTimeConditionalHooks.js'
import Sandbag from '../../../../test-app/app/models/Sandbag.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream AfterSaveCommit decorator', () => {
  context('creating', () => {
    it('runs the query after the transactions have been commited', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const composition = await Composition.create({
        userId: user.id,
        content: 'change me after save commit',
      })
      expect(composition.content).toEqual('changed after save commit')
    })

    it('calls the hook with no argument', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const spy = vi.spyOn(Composition.prototype, 'conditionallyChangeContentOnSaveCommit')
      await Composition.create({ user })

      expect(spy).toHaveBeenCalledExactlyOnceWith()
    })

    context('the entire statement is wrapped in a transaction', () => {
      it('runs commit hooks after transaction commits', async () => {
        let composition: Composition | null = null
        await ApplicationModel.transaction(async txn => {
          const user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })

          composition = await Composition.txn(txn).create({
            userId: user.id,
            content: 'change me after save commit',
          })
        })
        expect(composition!.content).toEqual('changed after save commit')
      })

      it('calls the hook with no argument', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const spy = vi.spyOn(Composition.prototype, 'conditionallyChangeContentOnSaveCommit')
        await ApplicationModel.transaction(async txn => await Composition.txn(txn).create({ user }))

        expect(spy).toHaveBeenCalledExactlyOnceWith()
      })
    })
  })

  context('updating', () => {
    it('runs the query after the transactions have been commited', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const composition = await Composition.create({
        userId: user.id,
      })
      await composition.update({
        content: 'change me after save commit',
      })
      expect(composition.content).toEqual('changed after save commit')
    })

    it('calls the hook with no argument', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const spy = vi.spyOn(Composition.prototype, 'conditionallyChangeContentOnSaveCommit')
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
            content: 'change me after save commit',
          })
        })
        expect(composition!.content).toEqual('changed after save commit')
      })

      it('calls the hook with no argument', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        const spy = vi.spyOn(Composition.prototype, 'conditionallyChangeContentOnSaveCommit')
        await ApplicationModel.transaction(
          async txn => await composition.txn(txn).update({ content: 'updated' })
        )

        expect(spy).toHaveBeenCalledExactlyOnceWith()
      })
    })
  })

  context('with ifChanged set on hook decorator', () => {
    let sandbag: Sandbag

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })
      sandbag = await mylar.createAssociation('sandbags', { weight: 10 })
    })

    context('one of the attributes specified in the "ifChanged" clause is changing', () => {
      it('calls the hook with no argument', async () => {
        const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterSaveCommitHook')
        await sandbag.update({ weight: 11 })

        expect(spy).toHaveBeenCalledExactlyOnceWith()
      })

      context('in a transaction', () => {
        it('calls the hook with no argument', async () => {
          const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterSaveCommitHook')
          await ApplicationModel.transaction(async txn => await sandbag.txn(txn).update({ weight: 11 }))

          expect(spy).toHaveBeenCalledExactlyOnceWith()
        })
      })
    })

    context('none of the attributes specified in the "ifChanged" clause are changing', () => {
      it('does not call the hook', async () => {
        await sandbag.update({ weight: null })
        const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterSaveCommitHook')
        await sandbag.update({ weightKgs: 120 })

        expect(spy).not.toHaveBeenCalled()
      })

      context('in a transaction', () => {
        it('does not call the hook', async () => {
          await sandbag.update({ weight: null })
          const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterSaveCommitHook')

          await ApplicationModel.transaction(async txn => await sandbag.txn(txn).update({ weightKgs: 120 }))

          expect(spy).not.toHaveBeenCalled()
        })
      })
    })

    context(
      'an infinite loop caused by saving in an AfterSaveCommit hook conditional on a datetime that is not changed in the hook',
      () => {
        it('is no longer an infinite loop', async () => {
          const obj = await ModelWithDateTimeConditionalHooks.create({ somethingHappenedAt: DateTime.now() })
          expect(obj.counter).toEqual(2)
        })

        context('in a transaction', () => {
          it('is no longer an infinite loop', async () => {
            const obj = await ApplicationModel.transaction(
              async txn =>
                await ModelWithDateTimeConditionalHooks.txn(txn).create({
                  somethingHappenedAt: DateTime.now(),
                })
            )
            expect(obj.counter).toEqual(2)
          })
        })
      }
    )
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('rejects an AfterSaveCommit method that declares a parameter', () => {
    const deco = new Decorators<typeof CompositionWithParameterizedHooks>()
    class CompositionWithParameterizedHooks extends Composition {
      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterSaveCommit()
      public requiredParameter(txn: DreamTransaction<any>) {
        void txn
      }

      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterSaveCommit()
      public optionalParameter(txn?: DreamTransaction<any>) {
        void txn
      }

      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterSaveCommit()
      public defaultedParameter(txn: DreamTransaction<any> | null = null) {
        void txn
      }

      // @ts-expect-error a commit hook is called with no argument, so it cannot declare a parameter
      @deco.AfterSaveCommit()
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
      @deco.AfterSaveCommit({ ifChanged: ['notAColumn'] })
      public hook() {}
    }
    void CompositionWithBadIfChanged
  })

  it('accepts an AfterSaveCommit method that declares no parameter', () => {
    const deco = new Decorators<typeof CompositionWithCommitHooks>()
    class CompositionWithCommitHooks extends Composition {
      @deco.AfterSaveCommit()
      public noParameter() {}

      @deco.AfterSaveCommit()
      public async asyncHook() {
        await Promise.resolve()
      }

      @deco.AfterSaveCommit()
      public thisTyped(this: CompositionWithCommitHooks) {
        void this.content
      }

      @deco.AfterSaveCommit({ ifChanged: ['content'] })
      public withIfChanged() {}
    }
    void CompositionWithCommitHooks
  })

  it('leaves AfterSaveCommit on a placement other than an instance method unchecked', () => {
    const deco = new Decorators<typeof CompositionWithOtherPlacements>()
    class CompositionWithOtherPlacements extends Composition {
      @deco.AfterSaveCommit()
      public arrowField = (txn?: DreamTransaction<any>) => {
        void txn
      }

      @deco.AfterSaveCommit()
      public accessor accessorField = (txn?: DreamTransaction<any>) => {
        void txn
      }

      @deco.AfterSaveCommit()
      public get getter() {
        return (txn: DreamTransaction<any>) => {
          void txn
        }
      }

      @deco.AfterSaveCommit()
      public static staticMethod(txn: DreamTransaction<any>) {
        void txn
      }
    }
    void CompositionWithOtherPlacements
  })
})
