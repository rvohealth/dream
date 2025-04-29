import { DateTime, UpdateableProperties } from '../../../../src/index.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
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
      it('calls hook', async () => {
        vi.spyOn(Sandbag.prototype, 'conditionalAfterSaveCommitHook')
        await sandbag.update({ weight: 11 })

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(Sandbag.prototype.conditionalAfterSaveCommitHook).toHaveBeenCalled()
      })

      context('in a transaction', () => {
        it('calls hook', async () => {
          vi.spyOn(Sandbag.prototype, 'conditionalAfterSaveCommitHook')
          await ApplicationModel.transaction(async txn => await sandbag.txn(txn).update({ weight: 11 }))

          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(Sandbag.prototype.conditionalAfterSaveCommitHook).toHaveBeenCalled()
        })
      })
    })

    context('none of the attributes specified in the "ifChanged" clause are changing', () => {
      it('does not call the hook', async () => {
        await sandbag.update({ weight: null })
        vi.spyOn(Sandbag.prototype, 'conditionalAfterSaveCommitHook')
        await sandbag.update({ weightKgs: 120 })

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(Sandbag.prototype.conditionalAfterSaveCommitHook).not.toHaveBeenCalled()
      })

      context('in a transaction', () => {
        it('does not call the hook', async () => {
          await sandbag.update({ weight: null })
          vi.spyOn(Sandbag.prototype, 'conditionalAfterSaveCommitHook')

          await ApplicationModel.transaction(async txn => await sandbag.txn(txn).update({ weightKgs: 120 }))

          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(Sandbag.prototype.conditionalAfterSaveCommitHook).not.toHaveBeenCalled()
        })
      })
    })

    context('datatypes', () => {
      context('jsonb', () => {
        const defaultAttrs: UpdateableProperties<ModelForOpenapiTypeSpecs> = {
          email: 'a@a',
          passwordDigest: 'abc',
        }

        context('for a newly-created record', () => {
          it('fires hooks when jsonb fields are changing', async () => {
            const spy = vi.spyOn(ModelForOpenapiTypeSpecs.prototype, 'conditionalAfterSaveJsonDataCommitHook')
            await ApplicationModel.transaction(async txn => {
              await ModelForOpenapiTypeSpecs.txn(txn).create({
                ...defaultAttrs,
                jsonData: { hello: 'world' },
              })
            })
            expect(spy).toHaveBeenCalled()
          })

          it('does not fire hooks when jsonb fields are not changing', async () => {
            const spy = vi.spyOn(ModelForOpenapiTypeSpecs.prototype, 'conditionalAfterSaveJsonDataCommitHook')
            await ApplicationModel.transaction(async txn => {
              await ModelForOpenapiTypeSpecs.txn(txn).create({
                ...defaultAttrs,
              })
            })
            expect(spy).not.toHaveBeenCalled()
          })
        })

        context('for an existing record being updated', () => {
          it.only('fires hooks when jsonb fields are changing', async () => {
            const record = await ModelForOpenapiTypeSpecs.create({
              ...defaultAttrs,
              jsonData: { hello: 'world' },
            })

            const reloaded = await ModelForOpenapiTypeSpecs.findOrFail(record.id)
            const spy = vi.spyOn(reloaded, 'conditionalAfterSaveJsonDataCommitHook')
            await ApplicationModel.transaction(
              async txn => await reloaded.txn(txn).update({ jsonData: { goodbye: 'world' } })
            )
            expect(spy).toHaveBeenCalled()
          })

          it('does not fire hooks when jsonb fields are not changing', async () => {
            const record = await ModelForOpenapiTypeSpecs.create({
              ...defaultAttrs,
            })

            const reloaded = await ModelForOpenapiTypeSpecs.findOrFail(record.id)
            const spy = vi.spyOn(reloaded, 'conditionalAfterSaveJsonDataCommitHook')
            await ApplicationModel.transaction(async txn => await reloaded.txn(txn).update({ email: 'b@b' }))
            expect(spy).not.toHaveBeenCalled()
          })
        })
      })
    })

    context(
      'an infinite loop caused by saving in an AfterSaveCommit hook conditional on a datetime that is not changed in the hook',
      () => {
        it('is no longer an infinite loop', async () => {
          await ModelWithDateTimeConditionalHooks.create({ somethingHappenedAt: DateTime.now() })
        })

        context('in a transaction', () => {
          it('is no longer an infinite loop', async () => {
            await ApplicationModel.transaction(
              async txn =>
                await ModelWithDateTimeConditionalHooks.txn(txn).create({
                  somethingHappenedAt: DateTime.now(),
                })
            )
          })
        })
      }
    )
  })
})
