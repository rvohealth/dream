import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream Scope (method variant)', () => {
  it('builds scope mapping', () => {
    const scopes = User['scopes'].named
    expect(scopes[0]!.method).toEqual('withFunnyName')
    expect(scopes[0]!.default).toEqual(false)
  })

  it('exposes a method which auto-applies scope', async () => {
    const user1 = await User.create({ email: 'how@ya0', password: 'doin', name: 'Chalupas jr' })
    const user2 = await User.create({ email: 'how@ya1', password: 'doin', name: 'Chalupas jr' })
    await User.create({ email: 'how@ya2', password: 'doin', name: 'Chalupas sr' })
    const results = await User.scope('withFunnyName').all()
    expect(results.map(r => r.id)).toEqual([user1.id, user2.id])
  })

  context('from child class', () => {
    it('allows scopes to be applied', async () => {
      const user = await User.create({ email: 'how@ya', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })
      await Mylar.create({ user, color: 'blue' })
      expect(await Mylar.scope('red').all()).toMatchDreamModels([mylar])
    })
  })
})
