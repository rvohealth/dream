import { Dream } from '../../../src'
import User from '../../../test-app/app/models/User'

describe('Dream.createOrFindBy', () => {
  context('no underlying conflicts to prevent save', () => {
    it('creates the underlying model in the db', async () => {
      const u = await User.createOrFindBy({ email: 'fred@frewd' }, { createWith: { password: 'howyadoin' } })
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
      const u = await User.createOrFindBy(
        { email: 'fred@fred' },
        { createWith: { password: 'nothowyadoin' } }
      )
      const user = await User.find(u!.id)
      expect(user!.email).toEqual('fred@fred')
      expect(await user!.checkPassword('howyadoin')).toEqual(true)
    })
  })

  context('when a non-foreign-key-constraint related issue crops up', () => {
    beforeEach(() => {
      jest
        .spyOn(Dream.prototype, 'save')
        .mockImplementation(() => new Promise((accept, reject) => reject(new Error('unexpected error!'))))
    })

    it('does not mask error', async () => {
      expect(
        async () =>
          await User.createOrFindBy({ email: 'fred@fred' }, { createWith: { password: 'nothowyadoin' } })
      ).rejects.toThrowError()
    })
  })
})
