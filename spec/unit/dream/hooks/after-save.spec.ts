import Composition from '../../../../test-app/app/models/composition'
import User from '../../../../test-app/app/models/user'

describe('Dream AfterSave decorator', () => {
  it('runs the query after saving a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id, content: 'change me after save' })
    expect(composition.content).toEqual('changed after save')

    await composition.reload()
    expect(composition.content).toEqual('change me after save')

    await composition.update({ content: 'something else' })
    expect(composition.content).toEqual('something else')

    await composition.update({ content: 'change me after save' })
    expect(composition.content).toEqual('changed after save')
    await composition.save()
    await composition.reload()
    expect(composition.content).toEqual('changed after save')
  })
})
