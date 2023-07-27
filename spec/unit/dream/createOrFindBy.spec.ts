import User from '../../../test-app/app/models/User'

describe('Dream.createOrFindBy', () => {
  context('no underlying conflicts to prevent save', () => {
    it('creates the underlying model in the db', async () => {
      const u = await User.createOrFindBy({ email: 'fred@frewd' }, { with: { password: 'howyadoin' } })
      const user = await User.find(u!.id)
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
      const u = await User.createOrFindBy({ email: 'fred@fred' }, { with: { password: 'nothowyadoin' } })
      const user = await User.find(u!.id)
      expect(user!.email).toEqual('fred@fred')
      expect(await user!.checkPassword('howyadoin')).toEqual(true)
    })
  })
})
