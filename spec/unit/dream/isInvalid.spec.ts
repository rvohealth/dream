import User from '../../../test-app/app/models/user'

describe('Dream#isInvalid', () => {
  it('returns true when the dream does have errors', async () => {
    const user = new User({ password: 'howyadoin' })
    expect(user.isInvalid).toBe(true)
  })

  it('returns false when the dream does not have any errors', async () => {
    const user = new User({ email: 'how@yadoin', password: 'howyadoin' })
    expect(user.isInvalid).toBe(false)
  })
})
