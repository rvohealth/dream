import User from '../../../test-app/app/models/User'

describe('Dream#isNewRecord', () => {
  it('returns true when the record is new', async () => {
    const user = User.new({ email: 'hi@there', password: 'howyadoin' })
    expect(user.isNewRecord).toBe(true)
  })

  it('returns false when the record is saved', async () => {
    const user = await User.create({ email: 'hi@there', password: 'howyadoin' })
    expect(user.isNewRecord).toBe(false)
  })
})
