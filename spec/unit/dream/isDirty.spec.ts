import User from '../../../test-app/app/models/user'

describe('Dream#isDirty', () => {
  it('reflects being dirty when dirty', async () => {
    const user = new User({ email: 'ham@', password: 'chalupas' })
    expect(user.isDirty).toEqual(true)

    await user.save()
    expect(user.isDirty).toEqual(false)

    user.email = 'ham@'
    expect(user.isDirty).toEqual(false)

    user.email = 'fish@'
    expect(user.isDirty).toEqual(true)

    user.email = 'ham@'
    expect(user.isDirty).toEqual(false)
  })
})
