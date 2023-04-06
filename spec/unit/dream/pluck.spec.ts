import User from '../../../src/test-app/app/models/user'

describe('Dream#pluck', () => {
  it('plucks the specified attributes and returns them as raw data', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.pluck('id')
    expect(records).toEqual([{ id: user1.id }, { id: user2.id }])
  })
})
