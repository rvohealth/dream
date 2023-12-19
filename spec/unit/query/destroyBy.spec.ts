import ops from '../../../src/ops'
import Query from '../../../src/dream/query'
import User from '../../../test-app/app/models/User'

describe('Query#destroyBy', () => {
  it('destroys all records matching the passed where clause', async () => {
    const user1 = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
    const user2 = await User.create({ email: 'how@yadoin', name: 'howyadoin', password: 'hamz' })
    const user3 = await User.create({ email: 'fish@yadoin', name: 'cheese', password: 'hamz' })

    await User.query().destroyBy({ name: 'howyadoin' })

    expect(await User.count()).toEqual(1)
    expect((await User.first())!.id).toEqual(user3.id)
  })

  context('similarity operator is passed', () => {
    it('raises a targeted exception', async () => {
      await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })

      await expect(async () => {
        await User.query().destroyBy({ name: ops.similarity('howyadoin') })
      }).rejects.toThrowError()

      expect(await User.count()).toEqual(1)
    })
  })
})
