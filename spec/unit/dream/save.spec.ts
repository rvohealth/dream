import User from '../../../test-app/app/models/user'

describe('Dream#save', () => {
  it('saves a new record', async () => {
    const u = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.find(u.id)
    expect(user!.email).toEqual('fred@frewd')
  })

  it('saves an existing record', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    user1.name = 'cheese'
    await user1.save()

    const user1Reloaded = await User.find(user1.id)
    expect(user1Reloaded!.name).toEqual('cheese')
  })
})
