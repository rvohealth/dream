import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.findOrCreateBy', () => {
  context('no underlying conflicts to prevent save', () => {
    it('creates the underlying model in the db', async () => {
      const u = await User.findOrCreateBy({ email: 'fred@frewd' }, { createWith: { password: 'howyadoin' } })
      const user = await User.find(u.id)
      expect(user!.email).toEqual('fred@frewd')
      expect(await user!.checkPassword('howyadoin')).toEqual(true)
    })
  })

  context('when a conflicting record already exists in the db', () => {
    beforeEach(async () => {
      await User.create({ email: 'fred@fred', password: 'howyadoin' })
    })

    it('returns the existing record, leaving existing attributes untouched', async () => {
      const u = await User.findOrCreateBy(
        { email: 'fred@fred' },
        { createWith: { password: 'nothowyadoin' } }
      )
      const user = await User.find(u.id)
      expect(user!.email).toEqual('fred@fred')
      expect(await user!.checkPassword('howyadoin')).toEqual(true)
    })
  })

  it('respects associations in primary opts', async () => {
    const user = await User.create({ email: 'fred@fred.fred', password: 'howyadoin' })
    const composition = await Composition.findOrCreateBy({ user }, { createWith: { content: 'howyadoin' } })
    expect(composition.userId).toEqual(user.id)
  })

  it('respects associations in secondary opts', async () => {
    const user = await User.create({ email: 'fred@fred.fred', password: 'howyadoin' })
    const composition = await Composition.findOrCreateBy({ content: 'howyadoin' }, { createWith: { user } })
    expect(composition.userId).toEqual(user.id)
  })

  it('respects associations in secondary opts with userId', async () => {
    const user = await User.create({ email: 'fred@fred.fred', password: 'howyadoin' })
    const composition = await Composition.findOrCreateBy(
      { content: 'howyadoin' },
      { createWith: { userId: user.id } }
    )
    expect(composition.userId).toEqual(user.id)
  })

  context('given a transaction', () => {
    it('creates the underlying model in the db', async () => {
      let u: User | null = null

      await ApplicationModel.transaction(async txn => {
        u = await User.txn(txn).findOrCreateBy(
          { email: 'fred@frewd' },
          { createWith: { password: 'howyadoin' } }
        )
      })

      const user = await User.find(u!.id)
      expect(user!.email).toEqual('fred@frewd')
      expect(await user!.checkPassword('howyadoin')).toEqual(true)
    })
  })
})
