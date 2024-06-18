import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import User from '../../../test-app/app/models/User'

describe('Dream.minThrough', () => {
  it('returns the min field, first traveling through nested associations', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    const composition = await Composition.create({ user })

    await CompositionAsset.create({ composition, score: 7 })
    await CompositionAsset.create({ composition, score: 3 })

    const min = await Composition.query().minThrough('compositionAssets', 'compositionAssets.score')

    expect(min).toEqual(3)
  })

  context('when passed a where clause', () => {
    it('respects the where clause', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, name: 'howyadoin', score: 7 })
      await CompositionAsset.create({ composition, score: 3 })

      const min = await Composition.query().minThrough(
        'compositionAssets',
        { name: 'howyadoin' },
        'compositionAssets.score'
      )

      expect(min).toEqual(7)
    })
  })

  context('when passed a transaction', () => {
    it('returns the min, traveling through nested associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, score: 7 })
      let min = await CompositionAsset.min('score')
      expect(min).toEqual(7)

      await ApplicationModel.transaction(async txn => {
        await CompositionAsset.txn(txn).create({ composition, score: 3 })

        min = await Composition.query().txn(txn).minThrough('compositionAssets', 'compositionAssets.score')
      })

      expect(min).toEqual(3)
    })
  })
})
