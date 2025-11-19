import { MockInstance } from 'vitest'
import DreamDbConnection from '../../../src/db/DreamDbConnection.js'
import ReplicaSafe from '../../../src/decorators/class/ReplicaSafe.js'
import ops from '../../../src/ops/index.js'
import User from '../../../test-app/app/models/User.js'

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
    let spy: MockInstance

    beforeEach(() => {
      spy = vi.spyOn(DreamDbConnection, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.all()

      expect(spy).toHaveBeenCalledWith('default', 'primary', expect.anything())

      expect(spy).not.toHaveBeenCalledWith('default', 'replica', expect.anything())
    })

    context('with replica connection specified', () => {
      @ReplicaSafe()
      class CustomUser extends User {}

      it('uses the replica connection', async () => {
        await CustomUser.query().all()

        expect(spy).toHaveBeenCalledWith('default', 'replica', expect.anything())
      })

      context('with explicit primary connection override', () => {
        it('uses the primary connection, despite being ReplicaSafe', async () => {
          await CustomUser.query().connection('primary').all()

          expect(spy).toHaveBeenCalledWith('default', 'primary', expect.anything())

          expect(spy).not.toHaveBeenCalledWith('replica', expect.objectContaining({}), expect.anything())
        })
      })
    })
  })
})
