import User from '../../../test-app/app/models/User'
import Query from '../../../src/dream/query'
import ConnectionConfRetriever from '../../../src/db/connection-conf-retriever'
import ReplicaSafe from '../../../src/decorators/replica-safe'

describe('Query#updateAll', () => {
  it('takes passed params and sends them through to all models matchin query', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const numRecords = await new Query(User).updateAll({
      name: 'cool',
    })
    expect(numRecords).toEqual(2)
    const records = await User.all()
    expect(records.map(r => r.name)).toMatchObject(['cool', 'cool'])
  })

  context('regarding connections', () => {
    beforeEach(async () => {
      await User.create({ email: 'fred@fred', password: 'howyadoin' })

      jest.spyOn(ConnectionConfRetriever.prototype, 'getConnectionConf')
    })

    it('uses primary connection', async () => {
      await User.where({ email: 'fred@fred' }).updateAll({ email: 'how@yadoin' })
      expect(ConnectionConfRetriever.prototype.getConnectionConf).toHaveBeenCalledWith('primary')
    })

    context('with replica connection specified', () => {
      @ReplicaSafe()
      class CustomUser extends User {}

      it('uses the primary connection', async () => {
        await CustomUser.where({ email: 'fred@fred' }).updateAll({ email: 'how@yadoin' })
        // should always call to primary for update, regardless of replica-safe status
        expect(ConnectionConfRetriever.prototype.getConnectionConf).toHaveBeenCalledWith('primary')
      })
    })
  })
})
