import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset.js'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit.js'
import Sandbag from '../../../../test-app/app/models/Sandbag.js'
import User from '../../../../test-app/app/models/User.js'

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

  context('with ifChanging set on hook decorator', () => {
    let sandbag: Sandbag

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })
      sandbag = await mylar.createAssociation('sandbags', { weightTons: 10 })
    })

    context('one of the attributes specified in the "ifChanging" clause is changing to non-null', () => {
      it('calls hook', async () => {
        const spy = vi.spyOn(Sandbag.prototype, 'conditionalBeforeUpdateHook')
        await sandbag.update({ weightTons: 11 })

        expect(spy).toHaveBeenCalled()
      })
    })

    context('none of the attributes specified in the "ifChanging" clause are changing', () => {
      it('calls hook', async () => {
        await sandbag.update({ weightTons: null })
        const spy = vi.spyOn(Sandbag.prototype, 'conditionalBeforeUpdateHook')
        await sandbag.update({ weightKgs: 120 })

        expect(spy).not.toHaveBeenCalled()
      })
    })
  })
})
