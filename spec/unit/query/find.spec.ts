import User from '../../../test-app/app/models/User'
import Pet from '../../../test-app/app/models/Pet'

describe('Query#find', () => {
  let user: User
  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
  })

  it('applies a where query and grabs first result', async () => {
    const reloadedUser = await User.limit(1).find(user.id)
    expect(reloadedUser).toMatchDreamModel(user)
  })
})
