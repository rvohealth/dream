import User from '../../../test-app/app/models/User'

describe('Query#delete', () => {
  it('deletes all records matching the query', async () => {
    await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
    await User.create({ email: 'how@yadoin', name: 'howyadoin', password: 'hamz' })
    const user3 = await User.create({ email: 'fish@yadoin', name: 'cheese', password: 'hamz' })

    await User.where({ name: 'howyadoin' }).delete()

    expect(await User.count()).toEqual(1)
    expect(await User.first()).toMatchDreamModel(user3)
  })
})
