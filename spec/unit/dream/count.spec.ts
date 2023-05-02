import User from '../../../test-app/app/models/user'
import Composition from '../../../test-app/app/models/composition'
import { Dream } from '../../../src'

describe('Dream.count', () => {
  it('finds all records for a given model', async () => {
    // await Composition.create()
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const results = await User.count()
    expect(results).toEqual(2)

    // const otherResults = await Composition.count()
    // expect(otherResults).toEqual(1)
  })

  context('when passed a transaction', () => {
    it('can report accurate count', async () => {
      let count: number = await User.count()
      expect(count).toEqual(0)

      await Dream.transaction(async txn => {
        await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        count = await User.txn(txn).count()
      })
      expect(count).toEqual(1)
    })
  })
})
