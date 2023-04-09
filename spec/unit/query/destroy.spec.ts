import User from '../../../test-app/app/models/user'

describe('Query#destroy', () => {
  it('destroys all records matching the query', async () => {
    const user1 = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
    const user2 = await User.create({ email: 'how@yadoin', name: 'howyadoin', password: 'hamz' })
    const user3 = await User.create({ email: 'fish@yadoin', name: 'cheese', password: 'hamz' })

    await User.where({ name: 'howyadoin' }).destroy()

    expect(await User.count()).toEqual(1)
    expect((await User.first())!.id).toEqual(user3.id)
  })
})
