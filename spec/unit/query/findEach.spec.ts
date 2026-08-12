import DreamDbConnection from '../../../src/db/DreamDbConnection.js'
import BatchingIncompatibleWithLimitOrOffset from '../../../src/errors/BatchingIncompatibleWithLimitOrOffset.js'
import ops from '../../../src/ops/index.js'
import User from '../../../test-app/app/models/User.js'

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

  context('when the Query carries a limit or offset', () => {
    it('rejects them rather than corrupting the batch windows', async () => {
      // the batch windows re-apply the Query's conditions per batch, so a
      // carried limit would be silently replaced by the batch size and a
      // carried offset re-applied to every window
      const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })
      await User.create({ email: 'b@b.com', password: 'howyadoin' })

      await expect(
        User.query()
          .limit(1)
          .findEach(() => {})
      ).rejects.toThrow(BatchingIncompatibleWithLimitOrOffset)
      await expect(
        User.query()
          .offset(1)
          .findEach(() => {})
      ).rejects.toThrow(BatchingIncompatibleWithLimitOrOffset)

      // a limit of zero means "no limit", so it batches as if no limit were set
      const users: User[] = []
      await User.query()
        .limit(0)
        .findEach(user => {
          users.push(user)
        })
      expect(users.length).toEqual(2)
      expect(users[0]).toMatchDreamModel(usera)
    })
  })

  context('regarding connections', () => {
    it('uses primary connection', async () => {
      const spy = vi.spyOn(DreamDbConnection, 'getConnection')
      await User.all()

      expect(spy).toHaveBeenCalledWith('default', 'primary', expect.anything())
      expect(spy).not.toHaveBeenCalledWith('default', 'replica', expect.anything())
    })
  })
})
