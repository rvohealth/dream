import { DateTime } from 'luxon'
import User from '../../../../test-app/app/models/User'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar'

describe('Dream Scope (default variant)', () => {
  it('builds scope mapping', async () => {
    const scopes = User.scopes.default
    expect(scopes[0].method).toEqual('hideDeleted')
    expect(scopes[0].default).toEqual(true)
  })

  it('exposes a method which auto-applies scope', async () => {
    const user1 = await User.create({ email: 'how@ya0', password: 'doin', deleted_at: DateTime.now() })
    const user2 = await User.create({ email: 'how@ya1', password: 'doin', deleted_at: DateTime.now() })
    const user3 = await User.create({ email: 'how@ya2', password: 'doin', name: 'Chalupas sr' })
    const results = await User.all()
    expect(results.map(r => r.id)).toEqual([user3.id])
  })

  context('from child class', () => {
    it('allows default scopes to be applied', async () => {
      const user = await User.create({ email: 'how@ya', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red', volume: 1 })
      const mylar2 = await Mylar.create({ user, color: 'blue', volume: 1 })
      await mylar2.destroy()
      expect(await Mylar.all()).toMatchDreamModels([mylar])
      expect(await Mylar.unscoped().all()).toMatchDreamModels([mylar, mylar2])
    })
  })
})
