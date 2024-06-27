import User from '../../../test-app/app/models/User'
import ops from '../../../src/ops'

describe('Query#find', () => {
  let user: User

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred o' })
  })

  it('returns the matching Dream model', async () => {
    const reloadedUser = await User.query().find(user.id)
    expect(reloadedUser).toMatchDreamModel(user)
  })

  context('when passed undefined', () => {
    it('returns null', async () => {
      expect(await User.query().find(undefined as any)).toBeNull()
    })
  })

  context('when passed null', () => {
    it('returns null', async () => {
      expect(await User.query().find(null as any)).toBeNull()
    })
  })

  context('when passed the id of a nonextant User', () => {
    it('returns null', async () => {
      expect(await User.query().find(parseInt(user.id as string) + 1)).toBeNull()
    })
  })

  context('when passed a similarity clause', () => {
    it('correctly filters on similarity text', async () => {
      expect(
        await User.query()
          .where({ name: ops.similarity('fredo') })
          .find(user.id)
      ).toMatchDreamModel(user)
      expect(
        await User.query()
          .where({ name: ops.similarity('nonmatch') })
          .find(user.id)
      ).toBeNull()
    })
  })
})
