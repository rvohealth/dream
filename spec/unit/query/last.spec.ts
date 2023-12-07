import User from '../../../test-app/app/models/User'
import Query from '../../../src/dream/query'
import ops from '../../../src/ops'

describe('Query#last', () => {
  it('returns last record found, ordered by id', async () => {
    const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
    const userc = await User.create({ email: 'c@c.com', password: 'howyadoin' })
    const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })

    const record = await User.last()
    expect(record).toMatchDreamModel(usera)
  })

  context('where clause is passed', () => {
    it('respects where', async () => {
      const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
      const userc = await User.create({ email: 'c@c.com', password: 'howyadoin' })
      const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })

      const record = await User.order('email').where({ email: 'b@b.com' }).last()
      expect(record).toMatchDreamModel(userb)
    })

    context('similarity operator is used', () => {
      it('correctly filters on similarity text', async () => {
        await User.create({ name: 'coolguy', email: 'cool@guy', password: 'howyadoin' })
        const user = await User.create({ name: 'fred o', email: 'fred@fred', password: 'howyadoin' })
        const user2 = await User.create({ name: 'fred o', email: 'frewd@fred', password: 'howyadoin' })

        expect(await new Query(User).where({ name: ops.similarity('fredo') }).last()).toMatchDreamModel(user2)
        expect(await new Query(User).where({ name: ops.similarity('nonmatch') }).last()).toBeNull()
      })
    })
  })

  it('respects order', async () => {
    const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
    const userc = await User.create({ email: 'c@c.com', password: 'howyadoin' })
    const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })

    const record = await User.order('email').last()
    expect(record).toMatchDreamModel(userc)
  })
})
