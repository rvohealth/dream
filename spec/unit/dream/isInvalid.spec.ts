import User from '../../../test-app/app/models/User'

describe('Dream#isInvalid', () => {
  it('returns true when the dream does have errors', () => {
    const user = User.new({ password: 'howyadoin' })
    expect(user.isInvalid).toBe(true)
  })

  it('returns false when the dream does not have any errors', () => {
    const user = User.new({ email: 'how@yadoin', password: 'howyadoin' })
    expect(user.isInvalid).toBe(false)
  })
})
