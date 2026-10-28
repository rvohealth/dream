import ops from '../../../src/ops/index.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import ModelForOpenapiTypeSpecs from '../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.where', () => {
  it('finds records matching specified conditions', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.where({ email: 'fred@frewd' }).all()
    expect(records.length).toEqual(1)
    expect(records[0]!.id).toEqual(user1.id)
  })

  context('when encased in a transaction', () => {
    let user1: User | null = null
    let records: User[] = []
    it('finds records matching specified conditions', async () => {
      await ApplicationModel.transaction(async txn => {
        user1 = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        await User.txn(txn).create({ email: 'how@yadoin', password: 'howyadoin' })

        records = await User.txn(txn).where({ email: 'fred@frewd' }).all()
      })
      expect(records).toMatchDreamModels([user1])
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', () => {
    User.where({
      // @ts-expect-error intentionally passing invalid arg to test that type protection is working
      invalidArg: 123,
    })
  })

  // The plain value form targets regular (scalar) columns; an array column is
  // compared through `ops`, e.g. `ops.equal(['red', 'green'])`.
  it('rejects a flat list against an array column', () => {
    // @ts-expect-error a flat list against an array column means IN; use ops.equal
    Balloon.where({ multicolor: ['red', 'green'] })
    // @ts-expect-error a flat list against an array column means IN; use ops.equal
    ModelForOpenapiTypeSpecs.where({ favoriteTexts: ['a', 'b'] })
    // @ts-expect-error a flat list against an array column means IN; use ops.equal
    ModelForOpenapiTypeSpecs.where({ requiredFavoriteIntegers: [1, 2] })
    // @ts-expect-error a flat list against an array column means IN; use ops.equal
    ModelForOpenapiTypeSpecs.where({ favoriteJsonbs: [{ a: 1 }] })
    // @ts-expect-error an array column's own value is compared through ops.equal
    Balloon.where({ multicolor: Mylar.new().multicolor })
  })

  it('accepts null, an empty list, a list of whole arrays and ops against an array column', () => {
    Balloon.where({ multicolor: null })
    Balloon.where({ multicolor: [] })
    Balloon.where({ multicolor: [['red', 'green'], ['blue']] })
    Balloon.where({ multicolor: [['red'], null] })
    ModelForOpenapiTypeSpecs.where({ requiredFavoriteTexts: [['a'], ['b']] })
    ModelForOpenapiTypeSpecs.where({ favoriteJsonbs: [[{ a: 1 }]] })
    Balloon.where({ multicolor: ops.equal(['red', 'green']) })
    Balloon.where({ multicolor: ops.not.equal(['red', 'green']) })
    Balloon.where({ multicolor: ops.any('red') })
    Balloon.where({ multicolor: ops.equal(Mylar.new().multicolor) })
  })

  it('accepts a list against a scalar or jsonb column', () => {
    Balloon.where({ color: ['red', 'blue'] })
    ModelForOpenapiTypeSpecs.where({ jsonbData: [1, 2] })
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(txn => {
        User.txn(txn).where({
          // @ts-expect-error intentionally passing invalid arg to test that type protection is working
          invalidArg: 123,
        })
      })
    })
  })
})
