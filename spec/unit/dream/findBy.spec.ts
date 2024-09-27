import CannotPassUndefinedAsAValueToAWhereClause from '../../../src/exceptions/cannot-pass-undefined-as-a-value-to-a-where-clause'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Balloon from '../../../test-app/app/models/Balloon'
import Latex from '../../../test-app/app/models/Balloon/Latex'
import User from '../../../test-app/app/models/User'

describe('Dream.findBy', () => {
  it('is able to locate records in the database by the attributes passed', async () => {
    const u = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.findBy({ id: u.id, email: 'fred@frewd' })
    expect(user!.email).toEqual('fred@frewd')
  })

  context('when passed undefined as a value', () => {
    it('raises an exception', async () => {
      await expect(async () => await User.findBy({ email: undefined })).rejects.toThrowError(
        CannotPassUndefinedAsAValueToAWhereClause
      )
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
