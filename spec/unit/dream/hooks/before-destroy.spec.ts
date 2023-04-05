import Composition from '../../../../src/test-app/app/models/composition'
import CompositionAsset from '../../../../src/test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../../src/test-app/app/models/composition-asset-audit'
import User from '../../../../src/test-app/app/models/user'

describe('Dream BeforeDestroy decorator', () => {
  it('runs the method before destroying a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    expect(composition.content).not.toEqual('something was destroyed')
    await compositionAsset.destroy()

    await composition.reload()
    expect(composition.content).toEqual('something was destroyed')
  })
})
