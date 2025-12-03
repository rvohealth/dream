import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.avg', () => {
  it('returns the avg', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    const composition = await Composition.create({ user })

    await CompositionAsset.create({ composition, score: 7 })
    await CompositionAsset.create({ composition, score: 3 })

    const avg = await CompositionAsset.avg('score')

    expect(avg).toEqual(5)
  })

  context('when passed a transaction', () => {
    it('returns the avg', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, score: 7 })
      let avg = await CompositionAsset.avg('score')
      expect(avg).toEqual(7)

      await ApplicationModel.transaction(async txn => {
        await CompositionAsset.txn(txn).create({ composition, score: 3 })

        avg = await CompositionAsset.txn(txn).avg('score')
      })

      expect(avg).toEqual(5)
    })
  })
})
