import CannotPassUndefinedAsAValueToAWhereClause from '../../../src/errors/CannotPassUndefinedAsAValueToAWhereClause.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.findBy', () => {
  it('is able to locate records in the database by the attributes passed', async () => {
    const u = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.findBy({ id: u.id, email: 'fred@frewd' })
    expect(user!.email).toEqual('fred@frewd')
  })

  context('when passed undefined as a value', () => {
    it('raises an exception', async () => {
      await expect(async () => await User.findBy({ email: undefined as any })).rejects.toThrowError(
        CannotPassUndefinedAsAValueToAWhereClause
      )
    })
  })

  context('when provided an association', () => {
    it('is able to locate records in the database by the provided instance', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const pet = await Pet.create({ user })

      expect(await Pet.findBy({ user })).toMatchDreamModel(pet)
    })
  })

  context('STI model', () => {
    it('is instantiated as the type specified in the type field', async () => {
      const latexBalloon = await Latex.create({ color: 'green' })
      const balloon = await Balloon.findBy({ color: 'green' })
      expect(balloon).toMatchDreamModel(latexBalloon)
    })
  })

  context('when passed a transaction', () => {
    it('can find records', async () => {
      let user: User | null = null
      await ApplicationModel.transaction(async txn => {
        const u = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        user = await User.txn(txn).findBy({ id: u.id })
      })
      expect(user!.email).toEqual('fred@frewd')
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', async () => {
    await User
      // @ts-expect-error intentionally passing invalid arg to test that type protection is working
      .findBy({ invalidArg: 123 })
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(async txn => {
        await User.txn(txn)
          // @ts-expect-error intentionally passing invalid arg to test that type protection is working
          .findBy({ invalidArg: 123 })
      })
    })
  })
})
