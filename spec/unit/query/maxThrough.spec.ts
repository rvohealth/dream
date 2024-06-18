import User from '../../../test-app/app/models/User'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'

describe('Dream.maxThrough', () => {
  it('returns the max field, first traveling through nested associations', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    const composition = await Composition.create({ user })

    await CompositionAsset.create({ composition, score: 7 })
    await CompositionAsset.create({ composition, score: 3 })

    const max = await Composition.query().maxThrough('compositionAssets', 'compositionAssets.score')

    expect(max).toEqual(7)
  })

  context('when passed a where clause', () => {
    it('respects the where clause', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, score: 7 })
      await CompositionAsset.create({ composition, name: 'howyadoin', score: 3 })

      const max = await Composition.query().maxThrough(
        'compositionAssets',
        { name: 'howyadoin' },
        'compositionAssets.score'
      )

      expect(max).toEqual(3)
    })
  })

  context('when passed a transaction', () => {
    it('returns the max, traveling through nested associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, score: 3 })
      let max = await CompositionAsset.max('score')
      expect(max).toEqual(3)

      await ApplicationModel.transaction(async txn => {
        await CompositionAsset.txn(txn).create({ composition, score: 7 })

        max = await Composition.query().txn(txn).maxThrough('compositionAssets', 'compositionAssets.score')
      })

      expect(max).toEqual(7)
    })
  })
})
