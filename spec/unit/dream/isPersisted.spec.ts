import User from '../../../test-app/app/models/User'

describe('Dream#isPersisted', () => {
  it('returns true when a new record is persisted', async () => {
    const user = await User.create({ email: 'hi@there', password: 'howyadoin' })
    expect(user.isPersisted).toBe(true)
  })

  it('returns true when the record is pulled from the database', async () => {
    await User.create({ email: 'hi@there', password: 'howyadoin' })
    const user = await User.first()
    expect(user!.isPersisted).toBe(true)
  })

  it("returns false when the record's primary key is manually set by the user", () => {
    const user = User.new({ email: 'hi@there', password: 'howyadoin' })
    user.id = 5
    expect(user.isPersisted).toBe(false)
  })

  it('returns false when the record is new', () => {
    const user = User.new({ email: 'hi@there', password: 'howyadoin' })
    expect(user.isPersisted).toBe(false)
  })
})
