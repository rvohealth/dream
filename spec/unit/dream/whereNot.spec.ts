import ops from '../../../src/ops/index.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.whereNot', () => {
  it('negates a query', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'danny@nelso', password: 'howyadoin' })
    const user3 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.whereNot({ email: 'fred@frewd' }).all()
    expect(records).toMatchDreamModels([user2, user3])
  })

  context('when encased in a transaction', () => {
    it('negates a query', async () => {
      let user2: User | null = null
      let user3: User | null = null
      let records: User[] = []
      await ApplicationModel.transaction(async txn => {
        await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        user2 = await User.txn(txn).create({ email: 'danny@nelso', password: 'howyadoin' })
        user3 = await User.txn(txn).create({ email: 'how@yadoin', password: 'howyadoin' })
        records = await User.txn(txn).whereNot({ email: 'fred@frewd' }).all()
      })

      expect(records).toMatchDreamModels([user2, user3])
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', () => {
    // @ts-expect-error intentionally passing invalid arg to test that type protection is working
    User.whereNot({ invalidArg: 123 })
  })

  // The plain value form targets regular (scalar) columns; an array column is
  // compared through `ops`, e.g. `ops.equal(['red', 'green'])`.
  it('rejects a flat list against an array column', () => {
    // @ts-expect-error a flat list against an array column means IN; use ops.equal
    Balloon.whereNot({ multicolor: ['red', 'green'] })
  })

  it('accepts null, an empty list, a list of whole arrays and ops against an array column', () => {
    Balloon.whereNot({ multicolor: null })
    Balloon.whereNot({ multicolor: [] })
    Balloon.whereNot({ multicolor: [['red', 'green'], null] })
    Balloon.whereNot({ multicolor: ops.equal(['red', 'green']) })
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(txn => {
        // @ts-expect-error intentionally passing invalid arg to test that type protection is working
        User.txn(txn).whereNot({ invalidArg: 123 })
      })
    })
  })
})
