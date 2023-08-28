import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit'
import User from '../../../../test-app/app/models/User'

describe('Dream BeforeUpdate decorator', () => {
  it('runs the query before updating a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id })
    const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })
    const compositionAssetAudit = await CompositionAssetAudit.create({
      compositionAssetId: compositionAsset.id,
    })
    expect(compositionAssetAudit.approval).toBeNull()

    await compositionAssetAudit.save()
    expect(compositionAssetAudit.approval).toEqual(false)
  })
})
