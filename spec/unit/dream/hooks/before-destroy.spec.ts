import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import User from '../../../../test-app/app/models/User'

describe('Dream BeforeDestroy decorator', () => {
  it('runs the method before destroying a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({
      composition_id: composition.id,
      src: 'mark before destroy',
    })

    expect(composition.content).not.toEqual('something was destroyed')
    await compositionAsset.destroy()

    await composition.reload()
    expect(composition.content).toEqual('something was destroyed')
  })
})
