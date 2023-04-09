import Composition from '../../../../test-app/app/models/composition'
import CompositionAsset from '../../../../test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../../test-app/app/models/composition-asset-audit'
import User from '../../../../test-app/app/models/user'

describe('Dream BeforeUpdate decorator', () => {
  it('runs the query before updating a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
    const compositionAssetAudit = await CompositionAssetAudit.create({
      composition_asset_id: compositionAsset.id,
    })
    expect(compositionAssetAudit.approval).toEqual(null)

    await compositionAssetAudit.save()
    expect(compositionAssetAudit.approval).toEqual(false)
  })
})
