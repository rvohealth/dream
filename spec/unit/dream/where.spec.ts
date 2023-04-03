import User from '../../../src/test-app/app/models/user'
import Composition from '../../../src/test-app/app/models/composition'

describe('Dream.where', () => {
  it('finds records matching specified conditions', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const record = await User.where({ email: 'fred@frewd' }).executeTakeFirstOrThrow()
    expect(record.id).toEqual(user1.id)
  })
})
