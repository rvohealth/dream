import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import User from '../../../test-app/app/models/User'

describe('Dream.minThrough', () => {
  beforeEach(async () => {
    // intentionally seed every test with an additional user
    // that has composition assets with very low scores,
    // to ensure that all calls to minThrough exclude associations
    // belonging to other users
    const otherUser = await User.create({ email: 'fred2@frewd', password: 'howyadoin', name: 'fred' })
    const otherComposition = await Composition.create({ user: otherUser })

    await CompositionAsset.create({ composition: otherComposition, score: 2 })
    await CompositionAsset.create({ composition: otherComposition, score: 1 })
  })

  it('returns the min field, first traveling through nested associations', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    const composition = await Composition.create({ user })

    await CompositionAsset.create({ composition, score: 7 })
    await CompositionAsset.create({ composition, score: 3 })

    const min = await user.minThrough('compositions', 'compositionAssets', 'compositionAssets.score')

    expect(min).toEqual(3)
  })

  context('when passed a where clause', () => {
    it('respects the where clause', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, name: 'howyadoin', score: 7 })
      await CompositionAsset.create({ composition, score: 3 })

      const min = await user.minThrough(
        'compositions',
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
      let min: number | null = 0

      await ApplicationModel.transaction(async txn => {
        await CompositionAsset.txn(txn).create({ composition, score: 3 })
        min = await user.txn(txn).minThrough('compositions', 'compositionAssets', 'compositionAssets.score')
      })

      expect(min).toEqual(3)
    })
  })
})
