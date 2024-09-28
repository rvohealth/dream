import DreamDbConnection from '../../../src/db/dream-db-connection'
import ReplicaSafe from '../../../src/decorators/replica-safe'
import ops from '../../../src/ops'
import User from '../../../test-app/app/models/User'

describe('Query#all', () => {
  it('returns all records, ordered by id', async () => {
    const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
    const userc = await User.create({ email: 'c@c.com', password: 'howyadoin' })
    const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })

    const record = await User.all()
    expect(record).toMatchDreamModels([userb, userc, usera])
  })

  context('where clause is passed', () => {
    it('respects where clause', async () => {
      const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
      await User.create({ email: 'c@c.com', password: 'howyadoin' })
      const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })

      const record = await User.where({ email: ['b@b.com', 'a@a.com'] })
        .order('email')
        .all()
      expect(record).toMatchDreamModels([usera, userb])
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

    const record = await User.order('email').all()
    expect(record).toMatchDreamModels([usera, userb, userc])
  })

  context('regarding connections', () => {
    beforeEach(() => {
      jest.spyOn(DreamDbConnection, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.all()

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary')

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(DreamDbConnection.getConnection).not.toHaveBeenCalledWith('replica')
    })

    context('with replica connection specified', () => {
      @ReplicaSafe()
      class CustomUser extends User {}

      it('uses the replica connection', async () => {
        await CustomUser.query().all()

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('replica')
      })

      context('with explicit primary connection override', () => {
        it('uses the primary connection, despite being ReplicaSafe', async () => {
          await CustomUser.query().connection('primary').all()

          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary')

          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(DreamDbConnection.getConnection).not.toHaveBeenCalledWith(
            'replica',
            expect.objectContaining({})
          )
        })
      })
    })
  })
})
