import User from '../../../test-app/app/models/User'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'

describe('Dream.min', () => {
  it('returns the min', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    const composition = await Composition.create({ user })

    await CompositionAsset.create({ composition, score: 7 })
    await CompositionAsset.create({ composition, score: 3 })

    const min = await CompositionAsset.min('score')

    expect(min).toEqual(3)
  })

  context('when passed a transaction', () => {
    it('returns the min', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, score: 7 })
      let min = await CompositionAsset.min('score')
      expect(min).toEqual(7)

      await ApplicationModel.transaction(async txn => {
        await CompositionAsset.txn(txn).create({ composition, score: 3 })

        min = await CompositionAsset.txn(txn).min('score')
      })

      expect(min).toEqual(3)
    })
  })
})
