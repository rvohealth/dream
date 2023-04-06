import User from '../../../src/test-app/app/models/user'

describe('Dream#isValid', () => {
  it('returns true when the dream does not have any errors', async () => {
    const user = new User({ email: 'hi@there', password: 'howyadoin' })
    expect(user.isValid).toBe(true)
  })

  it('returns false when the dream does have errors', async () => {
    const user = new User({ password: 'howyadoin' })
    expect(user.isValid).toBe(false)
  })
})
