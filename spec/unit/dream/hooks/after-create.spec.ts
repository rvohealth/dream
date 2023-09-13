import Composition from '../../../../test-app/app/models/Composition'
import User from '../../../../test-app/app/models/User'

describe('Dream AfterCreate decorator', () => {
  it('runs the query after creating a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id, content: 'change me after create' })
    expect(composition.content).toEqual('changed after create')
  })
})
