import User from '../../../src/test-app/app/models/user'

describe('Dream#destroy', () => {
  it('destroys the record in question', async () => {
    const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'ham' })
    const user2 = await User.create({ email: 'how@yadoin', name: 'howyadoin', password: 'ham' })

    await user.destroy()
    expect(await User.count()).toEqual(1)
    expect((await User.first())!.attributes).toEqual(user2.attributes)
  })
})
