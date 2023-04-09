import Composition from '../../../../test-app/app/models/composition'
import CompositionAsset from '../../../../test-app/app/models/composition-asset'
import User from '../../../../test-app/app/models/user'

describe('Dream BeforeSave decorator', () => {
  it('runs the query before creating a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
    expect(compositionAsset.src).toEqual('default src')
  })

  it('runs the query before updating a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
    compositionAsset.src = null
    await compositionAsset.save()
    expect(compositionAsset.src).toEqual('default src')
  })
})
