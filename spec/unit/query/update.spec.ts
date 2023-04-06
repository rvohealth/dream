import User from '../../../src/test-app/app/models/user'

describe('Query#update', () => {
  it('takes passed params and sends them through to all models matchin query', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.limit(2).update({
      name: 'cool',
    })
    expect(records.length).toEqual(2)
    expect(records[0].id).toEqual(user1.id)
    expect(records[0].name).toEqual('cool')
    expect(records[1].id).toEqual(user2.id)
    expect(records[1].name).toEqual('cool')
  })
})
