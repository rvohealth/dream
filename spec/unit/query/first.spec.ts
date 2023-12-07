import User from '../../../test-app/app/models/User'
import Query from '../../../src/dream/query'
import ops from '../../../src/ops'

describe('Query#first', () => {
  it('returns first record found, ordered by id', async () => {
    const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
    const userc = await User.create({ email: 'c@c.com', password: 'howyadoin' })
    const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })

    const record = await User.first()
    expect(record).toMatchDreamModel(userb)
  })

  context('where clause is passed', () => {
    it('respects where', async () => {
      const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
      const userc = await User.create({ email: 'c@c.com', password: 'howyadoin' })
      const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })

      const record = await User.order('email').where({ email: 'b@b.com' }).first()
      expect(record).toMatchDreamModel(userb)
    })

    context('similarity operator is used', () => {
      it('correctly filters on similarity text', async () => {
        const user = await User.create({ name: 'fred o', email: 'fred@fred', password: 'howyadoin' })
        const user2 = await User.create({ name: 'fred o', email: 'frewd@fred', password: 'howyadoin' })

        expect(await new Query(User).where({ name: ops.similarity('fredo') }).first()).toMatchDreamModel(user)
        expect(await new Query(User).where({ name: ops.similarity('nonmatch') }).first()).toBeNull()
      })
    })
  })

  it('respects order', async () => {
    const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
    const userc = await User.create({ email: 'c@c.com', password: 'howyadoin' })
    const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })

    const record = await User.order('email').first()
    expect(record).toMatchDreamModel(usera)
  })
})
