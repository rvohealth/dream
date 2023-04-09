import Composition from '../../../../test-app/app/models/composition'
import User from '../../../../test-app/app/models/user'

describe('Dream AfterUpdate decorator', () => {
  it('runs the query after updating a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id, content: 'howyadoin' })
    expect(composition.content).toEqual('howyadoin')

    await composition.update({ content: 'change me after update' })
    expect(composition.content).toEqual('changed after update')
  })
})
