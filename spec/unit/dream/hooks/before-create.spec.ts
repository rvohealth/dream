import Composition from '../../../../src/test-app/app/models/composition'
import User from '../../../../src/test-app/app/models/user'

describe('Dream BeforeCreate decorator', () => {
  it('runs the query before creating a record', async () => {
    // const composition = await Composition.create()
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    expect(composition.content).toEqual('default content')
  })
})
