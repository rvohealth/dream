import User from '../../../test-app/app/models/User'
import Query from '../../../src/dream/query'
import ops from '../../../src/ops'

describe('Query#findBy', () => {
  let user: User
  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred o' })
  })

  it('applies a where query and grabs first result', async () => {
    const reloadedUser = await new Query(User).findBy({ email: 'fred@frewd' })
    expect(reloadedUser).toMatchDreamModel(user)
  })

  context('similarity operator is used', () => {
    it('filters results on similarity match', async () => {
      expect(await new Query(User).findBy({ name: ops.similarity('fredo') })).toMatchDreamModel(user)
      expect(await new Query(User).findBy({ name: ops.similarity('nonmatch') })).toBeNull()
    })
  })
})
