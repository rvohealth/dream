import ConnectionRetriever from '../../../src/db/connection-retriever'
import ReplicaSafe from '../../../src/decorators/replica-safe'
import User from '../../../test-app/app/models/User'

describe('Query#destroy', () => {
  it('destroys all records matching the query', async () => {
    const user1 = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
    const user2 = await User.create({ email: 'how@yadoin', name: 'howyadoin', password: 'hamz' })
    const user3 = await User.create({ email: 'fish@yadoin', name: 'cheese', password: 'hamz' })

    await User.where({ name: 'howyadoin' }).destroy()

    expect(await User.count()).toEqual(1)
    expect((await User.first())!.id).toEqual(user3.id)
  })

  context('regarding connections', () => {
    beforeEach(async () => {
      await User.create({ email: 'fred@fred', password: 'howyadoin' })

      jest.spyOn(ConnectionRetriever.prototype, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.where({ email: 'fred@fred' }).destroy()
      expect(ConnectionRetriever.prototype.getConnection).toHaveBeenCalledWith('primary')
    })

    context('with replica connection specified', () => {
      @ReplicaSafe()
      class CustomUser extends User {}

      it('uses the replica connection', async () => {
        await CustomUser.where({ email: 'fred@fred' }).destroy()
        // should always call to primary for update, regardless of replica-safe status
        expect(ConnectionRetriever.prototype.getConnection).toHaveBeenCalledWith('primary')
      })
    })
  })
})
