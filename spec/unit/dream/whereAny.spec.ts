import ops from '../../../src/ops/index.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.whereAny', () => {
  it('finds records matching specified conditions', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'fred2@frewd', password: 'howyadoin' })
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.whereAny([{ email: 'fred@frewd' }, { email: 'fred2@frewd' }]).all()
    expect(records).toMatchDreamModels([user1, user2])
  })

  context('when encased in a transaction', () => {
    let user1: User | null = null
    let user2: User | null = null
    let records: User[] = []

    it('finds records matching specified conditions', async () => {
      await ApplicationModel.transaction(async txn => {
        user1 = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        user2 = await User.create({ email: 'fred2@frewd', password: 'howyadoin' })
        await User.txn(txn).create({ email: 'how@yadoin', password: 'howyadoin' })

        records = await User.txn(txn)
          .whereAny([{ email: 'fred@frewd' }, { email: 'fred2@frewd' }])
          .all()
      })
      expect(records).toMatchDreamModels([user1, user2])
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', () => {
    User.whereAny([
      {
        // @ts-expect-error intentionally passing invalid arg to test that type protection is working
        invalidArg: 123,
      },
    ])
  })

  // The plain value form targets regular (scalar) columns; an array column is
  // compared through `ops`, e.g. `ops.equal(['red', 'green'])`.
  it('rejects a flat list against an array column', () => {
    // @ts-expect-error a flat list against an array column means IN; use ops.equal
    Balloon.whereAny([{ multicolor: ['red', 'green'] }])
  })

  it('accepts null, an empty list, a list of whole arrays and ops against an array column', () => {
    Balloon.whereAny([
      { multicolor: null },
      { multicolor: [] },
      { multicolor: [['red', 'green'], null] },
      { multicolor: ops.equal(['red', 'green']) },
    ])
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(txn => {
        User.txn(txn).whereAny([
          {
            // @ts-expect-error intentionally passing invalid arg to test that type protection is working
            invalidArg: 123,
          },
        ])
      })
    })
  })
})
