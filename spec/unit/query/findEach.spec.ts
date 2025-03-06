import DreamDbConnection from '../../../src/db/DreamDbConnection'
import ops from '../../../src/ops'
import User from '../../../test-app/app/models/User'

describe('Query#findEach', () => {
  it('returns all records, ordered by id', async () => {
    const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })
    const userb = await User.create({ name: 'fred', email: 'b@b.com', password: 'howyadoin' })
    const userc = await User.create({ name: 'fred', email: 'c@c.com', password: 'howyadoin' })

    const users: User[] = []
    await User.query().findEach(user => {
      users.push(user)
    })
    expect(users).toMatchDreamModels([usera, userb, userc])
  })

  context('where clause is passed', () => {
    it('respects where clause', async () => {
      await User.create({ email: 'a@a.com', password: 'howyadoin' })
      const userb = await User.create({ name: 'fred', email: 'b@b.com', password: 'howyadoin' })
      const userc = await User.create({ name: 'fred', email: 'c@c.com', password: 'howyadoin' })

      const users: User[] = []
      await User.where({ name: 'fred' }).findEach(user => {
        users.push(user)
      })
      expect(users).toMatchDreamModels([userb, userc])
    })

    context('similarity operator is used', () => {
      it('filters out non-matching records', async () => {
        const userb = await User.create({ email: 'b@b.com', password: 'howyadoin', name: 'fred' })
        const userc = await User.create({ email: 'c@c.com', password: 'howyadoin', name: 'fredd' })
        await User.create({ email: 'a@a.com', password: 'howyadoin', name: 'calvin' })

        const record = await User.where({ name: ops.similarity('fred') })
          .order('email')
          .all()
        expect(record).toMatchDreamModels([userb, userc])
      })
    })
  })

  it('respects order', async () => {
    const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
    const userc = await User.create({ email: 'c@c.com', password: 'howyadoin' })
    const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })

    const records: User[] = []
    await User.order('email').findEach(user => {
      records.push(user)
    })
    expect(records).toMatchDreamModels([usera, userb, userc])
  })

  context('regarding connections', () => {
    beforeEach(() => {
      vi.spyOn(DreamDbConnection, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.all()

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary')

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(DreamDbConnection.getConnection).not.toHaveBeenCalledWith('replica')
    })
  })
})
