import User from '../../../test-app/app/models/User'
import Pet from '../../../test-app/app/models/Pet'
import Query from '../../../src/dream/query'

describe('Query#find', () => {
  let user: User

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
  })

  it('returns the matching Dream model', async () => {
    const reloadedUser = await new Query(User).find(user.id)
    expect(reloadedUser).toMatchDreamModel(user)
  })

  context('when passed undefined', () => {
    it('returns null', async () => {
      expect(await new Query(User).find(undefined)).toBeNull()
    })
  })

  context('when passed null', () => {
    it('returns null', async () => {
      expect(await new Query(User).find(null)).toBeNull()
    })
  })

  context('when passed the id of a nonextant User', () => {
    it('returns null', async () => {
      expect(await new Query(User).find(parseInt(user.id as string) + 1)).toBeNull()
    })
  })
})
