import User from '../../../src/test-app/app/models/user'
import Composition from '../../../src/test-app/app/models/composition'

describe('Dream.where', () => {
  it('finds records matching specified conditions', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.where({ email: 'fred@frewd' }).all()
    expect(records.length).toEqual(1)
    expect(records[0].id).toEqual(user1.id)
  })
})
