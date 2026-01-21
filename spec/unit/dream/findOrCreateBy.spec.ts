import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import Pet from '../../../test-app/app/models/Pet.js'
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

  context('when provided an association', () => {
    it('is able to locate records in the database by the provided instance', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const pet = await Pet.create({ user })

      expect(await Pet.findOrCreateBy({ user })).toMatchDreamModel(pet)
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

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', async () => {
    await User
      // @ts-expect-error intentionally passing invalid arg to test that type protection is working
      .findOrCreateBy({ invalidArg: 123 })
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(async txn => {
        await User.txn(txn)
          // @ts-expect-error intentionally passing invalid arg to test that type protection is working
          .findOrCreateBy({ invalidArg: 123 })
      })
    })
  })
})
