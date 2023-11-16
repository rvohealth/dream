import Composition from '../../../test-app/app/models/Composition'
import User from '../../../test-app/app/models/User'

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
    let existingUser: User
    beforeEach(async () => {
      existingUser = await User.create({ email: 'fred@fred', password: 'howyadoin' })
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
    expect(composition!.userId).toEqual(user.id)
  })

  it('respects associations in secondary opts', async () => {
    const user = await User.create({ email: 'fred@fred.fred', password: 'howyadoin' })
    const composition = await Composition.findOrCreateBy({ content: 'howyadoin' }, { createWith: { user } })
    expect(composition!.userId).toEqual(user.id)
  })
})
