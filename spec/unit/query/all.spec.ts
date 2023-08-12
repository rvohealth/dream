import ConnectionRetriever from '../../../src/db/connection-retriever'
import ReplicaSafe from '../../../src/decorators/replica-safe'
import Balloon from '../../../test-app/app/models/Balloon'
import User from '../../../test-app/app/models/User'

describe('Query#all', () => {
  it('returns all records, ordered by id', async () => {
    const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
    const userc = await User.create({ email: 'c@c.com', password: 'howyadoin' })
    const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })

    const record = await User.all()
    expect(record).toMatchDreamModels([userb, userc, usera])
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
      jest.spyOn(ConnectionRetriever.prototype, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.all()
      expect(ConnectionRetriever.prototype.getConnection).toHaveBeenCalledWith('primary')
    })

    context('with replica connection specified', () => {
      @ReplicaSafe()
      class CustomUser extends User {}

      it('uses the replica connection', async () => {
        await CustomUser.all()
        expect(ConnectionRetriever.prototype.getConnection).toHaveBeenCalledWith('replica')
      })
    })
  })
})
