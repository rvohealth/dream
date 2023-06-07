import User from '../../../test-app/app/models/User'
import { Dream } from '../../../src'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'

describe('Dream.max', () => {
  it('returns the max', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    const composition = await Composition.create({ user })

    const compositionAsset1 = await CompositionAsset.create({ composition, score: 7 })
    const compositionAsset2 = await CompositionAsset.create({ composition, score: 3 })

    const max = await CompositionAsset.max('score')

    expect(max).toEqual(7)
  })

  context('when passed a transaction', () => {
    it('returns the max', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      const compositionAsset1 = await CompositionAsset.create({ composition, score: 3 })
      let max = await CompositionAsset.max('score')
      expect(max).toEqual(3)

      await Dream.transaction(async txn => {
        const compositionAsset2 = await CompositionAsset.txn(txn).create({ composition, score: 7 })

        max = await CompositionAsset.txn(txn).max('score')
      })

      expect(max).toEqual(7)
    })
  })
})
