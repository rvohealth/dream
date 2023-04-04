import User from '../../../../src/test-app/app/models/user'

describe('Query#destroy', () => {
  it('destroys all records matching the query', async () => {
    const user1 = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'ham' })
    const user2 = await User.create({ email: 'how@yadoin', name: 'howyadoin', password: 'ham' })
    const user3 = await User.create({ email: 'fish@yadoin', name: 'cheese', password: 'ham' })

    await User.where({ name: 'howyadoin' }).destroy()

    expect(await User.count()).toEqual(1)
    expect((await User.first()).id).toEqual(user3.id)
  })
})
