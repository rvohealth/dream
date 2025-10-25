import Dream from '../../../src/Dream.js'
import CreateOrFindByFailedToCreateAndFind from '../../../src/errors/CreateOrFindByFailedToCreateAndFind.js'
import Composition from '../../../test-app/app/models/Composition.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.createOrFindBy', () => {
  context('no underlying conflicts to prevent save', () => {
    it('creates the underlying model in the db', async () => {
      const u = await User.createOrFindBy({ email: 'fred@frewd' }, { createWith: { password: 'howyadoin' } })
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
      const u = await User.createOrFindBy(
        { email: 'fred@fred' },
        { createWith: { password: 'nothowyadoin' } }
      )
      const user = await User.find(u.id)
      expect(user!.email).toEqual('fred@fred')
      expect(await user!.checkPassword('howyadoin')).toEqual(true)
    })
  })

  context(
    'when createOrFindBy attribute doesn’t match an existing record, but a `createWith` field conflicts with an existing record',
    () => {
      beforeEach(async () => {
        await User.create({
          email: 'fred@fred',
          socialSecurityNumber: '1234567890',
          password: 'howyadoin',
        })
      })

      it('throws CreateOrFindByFailedToCreateAndFind', async () => {
        await expect(
          User.createOrFindBy(
            { email: 'howya@doin' },
            { createWith: { socialSecurityNumber: '1234567890', password: 'nothowyadoin' } }
          )
        ).rejects.toThrow(CreateOrFindByFailedToCreateAndFind)
      })
    }
  )

  context('when a non-foreign-key-constraint related issue crops up', () => {
    beforeEach(() => {
      vi.spyOn(Dream.prototype, 'save').mockImplementation(
        () => new Promise((accept, reject) => reject(new Error('unexpected error!')))
      )
    })

    it('does not mask error', async () => {
      await expect(
        User.createOrFindBy({ email: 'fred@fred' }, { createWith: { password: 'nothowyadoin' } })
      ).rejects.toThrow()
    })
  })

  it('respects associations in primary opts', async () => {
    const user = await User.create({ email: 'fred@fred.fred', password: 'howyadoin' })
    const composition = await Composition.createOrFindBy({ user }, { createWith: { content: 'howyadoin' } })
    expect(composition.userId).toEqual(user.id)
  })

  it('respects associations in secondary opts', async () => {
    const user = await User.create({ email: 'fred@fred.fred', password: 'howyadoin' })
    const composition = await Composition.createOrFindBy({ content: 'howyadoin' }, { createWith: { user } })
    expect(composition.userId).toEqual(user.id)
  })
})
