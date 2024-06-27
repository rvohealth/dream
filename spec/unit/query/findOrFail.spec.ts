import User from '../../../test-app/app/models/User'
import ops from '../../../src/ops'
import RecordNotFound from '../../../src/exceptions/record-not-found'

describe('Query#findOrFail', () => {
  let user: User

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred o' })
  })

  it('returns the matching Dream model', async () => {
    const reloadedUser = await User.query().findOrFail(user.id)
    expect(reloadedUser).toMatchDreamModel(user)
  })

  context('when passed undefined', () => {
    it('raises an exception', async () => {
      await expect(async () => await User.query().findOrFail(undefined as any)).rejects.toThrow(
        RecordNotFound
      )
    })
  })

  context('when passed null', () => {
    it('raises an exception', async () => {
      await expect(async () => await User.query().findOrFail(null as any)).rejects.toThrow(RecordNotFound)
    })
  })

  context('when passed the id of a nonextant User', () => {
    it('raises an exception', async () => {
      await expect(
        async () => await User.query().findOrFail(parseInt(user.id as string) + 1)
      ).rejects.toThrow(RecordNotFound)
    })
  })

  context('when passed a similarity clause', () => {
    it('correctly filters on similarity text', async () => {
      expect(
        await User.query()
          .where({ name: ops.similarity('fredo') })
          .findOrFail(user.id)
      ).toMatchDreamModel(user)
      await expect(
        async () =>
          await User.query()
            .where({ name: ops.similarity('nonmatch') })
            .findOrFail(user.id)
      ).rejects.toThrow(RecordNotFound)
    })
  })
})
