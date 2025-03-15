import RecordNotFound from '../../../src/errors/RecordNotFound.js'
import ops from '../../../src/ops/index.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#findOrFailBy', () => {
  let user: User
  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred o' })
  })

  it('applies a where query and grabs first result', async () => {
    const reloadedUser = await User.query().findBy({ email: 'fred@frewd' })
    expect(reloadedUser).toMatchDreamModel(user)
  })

  context('when no record is found', () => {
    it('raises an exception', async () => {
      await expect(User.query().findOrFailBy({ email: 'chalupasmcgee' })).rejects.toThrow(RecordNotFound)
    })
  })

  context('similarity operator is used', () => {
    it('filters results on similarity match', async () => {
      expect(await User.query().findOrFailBy({ name: ops.similarity('fredo') })).toMatchDreamModel(user)
      await expect(
        async () => await User.query().findOrFailBy({ name: ops.similarity('nonmatch') })
      ).rejects.toThrow(RecordNotFound)
    })
  })
})
