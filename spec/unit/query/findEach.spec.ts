import ReplicaSafe from '../../../src/decorators/replica-safe'
import User from '../../../test-app/app/models/User'
import DreamDbConnection from '../../../src/db/dream-db-connection'
import ops from '../../../src/ops'

describe('Query#findEach', () => {
  it('returns all records, ordered by id', async () => {
    const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })
    const userb = await User.create({ name: 'fred', email: 'b@b.com', password: 'howyadoin' })
    const userc = await User.create({ name: 'fred', email: 'c@c.com', password: 'howyadoin' })

    const users: User[] = []
    await User.query().findEach(async user => {
      users.push(user)
    })
    expect(users).toMatchDreamModels([usera, userb, userc])
  })

  context('where clause is passed', () => {
    it('respects where clause', async () => {
      const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })
      const userb = await User.create({ name: 'fred', email: 'b@b.com', password: 'howyadoin' })
      const userc = await User.create({ name: 'fred', email: 'c@c.com', password: 'howyadoin' })

      const users: User[] = []
      await User.where({ name: 'fred' }).findEach(async user => {
        users.push(user)
      })
      expect(users).toMatchDreamModels([userb, userc])
    })

    context('similarity operator is used', () => {
      it('filters out non-matching records', async () => {
        const userb = await User.create({ email: 'b@b.com', password: 'howyadoin', name: 'fred' })
        const userc = await User.create({ email: 'c@c.com', password: 'howyadoin', name: 'fredd' })
        const usera = await User.create({ email: 'a@a.com', password: 'howyadoin', name: 'calvin' })

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
    await User.order('email').findEach(async user => {
      records.push(user)
    })
    expect(records).toMatchDreamModels([usera, userb, userc])
  })

  context('regarding connections', () => {
    beforeEach(() => {
      jest.spyOn(DreamDbConnection, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.all()
      expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary', expect.objectContaining({}))
      expect(DreamDbConnection.getConnection).not.toHaveBeenCalledWith('replica', expect.objectContaining({}))
    })

    context('with replica connection specified', () => {
      @ReplicaSafe()
      class CustomUser extends User {}

      it('uses the replica connection', async () => {
        await CustomUser.query().findEach(() => {})
        expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('replica', expect.objectContaining({}))
      })

      context('with explicit primary connection override', () => {
        it('uses the primary connection, despite being ReplicaSafe', async () => {
          await CustomUser.query()
            .connection('primary')
            .findEach(() => {})
          expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary', expect.objectContaining({}))
          expect(DreamDbConnection.getConnection).not.toHaveBeenCalledWith(
            'replica',
            expect.objectContaining({})
          )
        })
      })
    })
  })
})
