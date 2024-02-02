import User from '../../../test-app/app/models/User'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'

describe('Dream.limit', () => {
  it('limits the results', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    const composition = await Composition.create({ user })

    const compositionAsset1 = await CompositionAsset.create({ composition })
    const compositionAsset2 = await CompositionAsset.create({ composition })
    const compositionAsset3 = await CompositionAsset.create({ composition })

    const results = await CompositionAsset.limit(2).all()

    expect(results).toMatchDreamModels([compositionAsset1, compositionAsset2])
  })

  context('when passed null', () => {
    it('removes limit', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      const compositionAsset1 = await CompositionAsset.create({ composition })
      const compositionAsset2 = await CompositionAsset.create({ composition })
      const compositionAsset3 = await CompositionAsset.create({ composition })

      const results = await CompositionAsset.limit(2).limit(null).all()

      expect(results).toMatchDreamModels([compositionAsset1, compositionAsset2, compositionAsset3])
    })
  })

  context('when passed a transaction', () => {
    it('limits the results', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      const compositionAsset1 = await CompositionAsset.create({ composition, score: 7 })
      let compositionAsset2: CompositionAsset | undefined = undefined
      let compositionAsset3: CompositionAsset | undefined = undefined
      let results: CompositionAsset[] = []

      await ApplicationModel.transaction(async txn => {
        compositionAsset2 = await CompositionAsset.txn(txn).create({ composition, score: 3 })
        compositionAsset3 = await CompositionAsset.txn(txn).create({ composition, score: 3 })

        results = await CompositionAsset.txn(txn).limit(2).all()
      })

      expect(results).toMatchDreamModels([compositionAsset1, compositionAsset2])
    })

    context('when passed null', () => {
      it('removes limit', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        const composition = await Composition.create({ user })

        const compositionAsset1 = await CompositionAsset.create({ composition })
        let compositionAsset2: CompositionAsset | undefined = undefined
        let compositionAsset3: CompositionAsset | undefined = undefined

        let results: CompositionAsset[] = []
        await ApplicationModel.transaction(async txn => {
          compositionAsset2 = await CompositionAsset.create({ composition })
          compositionAsset3 = await CompositionAsset.create({ composition })
          results = await CompositionAsset.txn(txn).limit(null).limit(2).limit(null).all()
        })

        expect(results).toMatchDreamModels([compositionAsset1, compositionAsset2, compositionAsset3])
      })
    })
  })
})
