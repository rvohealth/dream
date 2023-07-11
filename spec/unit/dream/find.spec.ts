import Dream from '../../../src/dream'
import User from '../../../test-app/app/models/User'

describe('Dream.find', () => {
  let user: User

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
  })

  it('returns the matching Dream model', async () => {
    expect(await User.find(user.id)).toMatchDreamModel(user)
  })

  context('when passed undefined', () => {
    it('returns null', async () => {
      expect(await User.find(undefined)).toBeNull()
    })
  })

  context('when passed null', () => {
    it('returns null', async () => {
      expect(await User.find(null)).toBeNull()
    })
  })

  context('when passed the id of a nonextant User', () => {
    it('returns null', async () => {
      expect(await User.find(parseInt(user.id as string) + 1)).toBeNull()
    })
  })

  context('when passed a transaction', () => {
    it('can find records', async () => {
      await Dream.transaction(async txn => {
        expect(await User.txn(txn).find(user.id)).toMatchDreamModel(user)
      })
    })
  })
})
