import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import User from '../../../../test-app/app/models/User'

describe('Dream AfterDestroy decorator', () => {
  it('runs the method after destroying a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id, content: 'howyadoin' })
    const compositionAsset = await CompositionAsset.create({
      compositionId: composition.id,
      src: 'mark after destroy',
    })

    expect(composition.content).toEqual('howyadoin')
    await compositionAsset.destroy()
    await composition.reload()

    expect(composition.content).toEqual('changed after destroying composition asset')
  })
})
