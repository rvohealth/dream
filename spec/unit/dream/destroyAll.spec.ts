import User from '../../../src/test-app/app/models/user'

describe('Dream#destroyAll', () => {
  it('destroys all records matching the query', async () => {
    await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'ham' })
    await User.create({ email: 'how@yadoin', name: 'howyadoin', password: 'ham' })
    await User.create({ email: 'fish@yadoin', name: 'cheese', password: 'ham' })

    await User.destroyAll()
    expect(await User.count()).toEqual(0)
  })
})
