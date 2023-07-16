import User from '../../../test-app/app/models/User'
import Query from '../../../src/dream/query'

describe('Query#last', () => {
  it('returns last record found, ordered by id', async () => {
    const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
    const userc = await User.create({ email: 'c@c.com', password: 'howyadoin' })
    const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })

    const record = await User.last()
    expect(record).toMatchDreamModel(usera)
  })

  it('respects order', async () => {
    const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
    const userc = await User.create({ email: 'c@c.com', password: 'howyadoin' })
    const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })

    const record = await User.order('email').last()
    expect(record).toMatchDreamModel(userc)
  })
})
