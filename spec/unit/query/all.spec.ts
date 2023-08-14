import ConnectionConfRetriever from '../../../src/db/connection-conf-retriever'
import ReplicaSafe from '../../../src/decorators/replica-safe'
import Balloon from '../../../test-app/app/models/Balloon'
import User from '../../../test-app/app/models/User'
import Query from '../../../src/dream/query'
import DreamDbConnection from '../../../src/db/dream-db-connection'

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
      jest.spyOn(DreamDbConnection, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.all()
      expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary')
      expect(DreamDbConnection.getConnection).not.toHaveBeenCalledWith('replica')
    })

    context('with replica connection specified', () => {
      @ReplicaSafe()
      class CustomUser extends User {}

      it('uses the replica connection', async () => {
        await new Query(CustomUser).all()
        expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('replica')
      })

      context('with explicit primary connection override', () => {
        it('uses the primary connection, despite being ReplicaSafe', async () => {
          await new Query(CustomUser).connection('primary').all()
          expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary')
          expect(DreamDbConnection.getConnection).not.toHaveBeenCalledWith('replica')
        })
      })
    })
  })
})
