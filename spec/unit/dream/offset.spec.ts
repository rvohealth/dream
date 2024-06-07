import User from '../../../test-app/app/models/User'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'

describe('Dream#offset', () => {
  it('applies offset to results', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    const composition = await Composition.create({ user })

    await CompositionAsset.create({ composition })
    const compositionAsset2 = await CompositionAsset.create({ composition })
    const compositionAsset3 = await CompositionAsset.create({ composition })

    // updating compositionAsset2 here causes the default ordering in the db to shift,
    // enabling us to provde that ordering by id is working
    await compositionAsset2.update({ primary: true })

    const results = await CompositionAsset.limit(2).offset(1).all()

    expect(results).toMatchDreamModels([compositionAsset2, compositionAsset3])
  })

  context('order is applied', () => {
    it('orders by provided order statement', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, name: 'aaa' })
      const compositionAsset2 = await CompositionAsset.create({ composition, name: 'ccc' })
      const compositionAsset3 = await CompositionAsset.create({ composition, name: 'bbb' })

      // updating compositionAsset2 here causes the default ordering in the db to shift,
      // enabling us to provde that ordering by id is working
      await compositionAsset2.update({ primary: true })

      const results = await CompositionAsset.limit(2).offset(1).order('name').all()

      expect(results).toMatchDreamModels([compositionAsset3, compositionAsset2])
    })
  })

  context('offset is null', () => {
    it('removes offset', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      const compositionAsset1 = await CompositionAsset.create({ composition })
      const compositionAsset2 = await CompositionAsset.create({ composition })
      await CompositionAsset.create({ composition })

      const results = await CompositionAsset.limit(2).offset(1).offset(null).all()

      expect(results).toMatchDreamModels([compositionAsset1, compositionAsset2])
    })
  })

  context('limit is null', () => {
    it('removes offset', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      const compositionAsset1 = await CompositionAsset.create({ composition })
      const compositionAsset2 = await CompositionAsset.create({ composition })
      const compositionAsset3 = await CompositionAsset.create({ composition })

      const results = await CompositionAsset.limit(2).offset(1).limit(null).all()

      expect(results).toMatchDreamModels([compositionAsset1, compositionAsset2, compositionAsset3])
    })
  })

  context('when passed a transaction', () => {
    it('applies offset to results', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, score: 7 })
      let compositionAsset2: CompositionAsset | undefined = undefined
      let results: CompositionAsset[] = []

      await ApplicationModel.transaction(async txn => {
        compositionAsset2 = await CompositionAsset.txn(txn).create({ composition, score: 3 })
        results = await CompositionAsset.txn(txn).offset(1).limit(1).all()
      })

      expect(results).toMatchDreamModels([compositionAsset2])
    })

    context('offset is null', () => {
      it('removes offset', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        const composition = await Composition.create({ user })

        const compositionAsset1 = await CompositionAsset.create({ composition })
        let results: CompositionAsset[] = []

        await ApplicationModel.transaction(async txn => {
          await CompositionAsset.txn(txn).create({ composition, score: 3 })
          results = await CompositionAsset.txn(txn).offset(null).offset(1).limit(1).offset(null).all()
        })

        expect(results).toMatchDreamModels([compositionAsset1])
      })
    })

    context('limit is null', () => {
      it('removes offset', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        const composition = await Composition.create({ user })

        const compositionAsset1 = await CompositionAsset.create({ composition })
        let compositionAsset2: CompositionAsset | undefined = undefined
        let results: CompositionAsset[] = []

        await ApplicationModel.transaction(async txn => {
          compositionAsset2 = await CompositionAsset.txn(txn).create({ composition, score: 3 })
          results = await CompositionAsset.txn(txn).offset(1).limit(1).limit(null).all()
        })

        expect(results).toMatchDreamModels([compositionAsset1, compositionAsset2])
      })
    })
  })
})
