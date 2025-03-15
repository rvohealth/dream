import RecordNotFound from '../../../src/errors/RecordNotFound.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.findOrFailBy', () => {
  it('is able to locate records in the database by the attributes passed', async () => {
    const u = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.findOrFailBy({ id: u.id, email: 'fred@frewd' })
    expect(user.email).toEqual('fred@frewd')
  })

  context('when no record is found', () => {
    it('raises an exception', async () => {
      await expect(User.findOrFailBy({ email: 'chalupasmcgee' })).rejects.toThrow(RecordNotFound)
    })
  })

  context('STI model', () => {
    it('is instantiated as the type specified in the type field', async () => {
      const latexBalloon = await Latex.create({ color: 'green' })
      const balloon = await Balloon.findOrFailBy({ color: 'green' })
      expect(balloon).toMatchDreamModel(latexBalloon)
    })
  })

  context('when passed a transaction', () => {
    it('can find records', async () => {
      let user: User | null = null
      await ApplicationModel.transaction(async txn => {
        const u = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        user = await User.txn(txn).findOrFailBy({ id: u.id })
      })
      expect(user!.email).toEqual('fred@frewd')
    })
  })
})
