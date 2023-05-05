import User from '../../../../test-app/app/models/User'

describe('Dream Scope (method variant)', () => {
  it('builds scope mapping', async () => {
    const scopes = User.scopes.named
    expect(scopes[0].method).toEqual('withFunnyName')
    expect(scopes[0].default).toEqual(false)
  })

  it('exposes a method which auto-applies scope', async () => {
    const user1 = await User.create({ email: 'how@ya0', password: 'doin', name: 'Chalupas jr' })
    const user2 = await User.create({ email: 'how@ya1', password: 'doin', name: 'Chalupas jr' })
    const user3 = await User.create({ email: 'how@ya2', password: 'doin', name: 'Chalupas sr' })
    const results = await User.scope('withFunnyName').all()
    expect(results.map(r => r.id)).toEqual([user1.id, user2.id])
  })
})
