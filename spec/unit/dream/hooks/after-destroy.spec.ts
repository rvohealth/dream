import Composition from '../../../../src/test-app/app/models/composition'
import CompositionAsset from '../../../../src/test-app/app/models/composition-asset'
import User from '../../../../src/test-app/app/models/user'

describe('Dream AfterDestroy decorator', () => {
  it('runs the method after destroying a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id, content: 'howyadoin' })
    const compositionAsset = await CompositionAsset.create({
      composition_id: composition.id,
      src: 'mark after destroy',
    })

    expect(composition.content).toEqual('howyadoin')
    await compositionAsset.destroy()
    await composition.reload()

    expect(composition.content).toEqual('changed after destroying composition asset')
  })
})
