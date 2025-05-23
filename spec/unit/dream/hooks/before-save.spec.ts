import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset.js'
import Sandbag from '../../../../test-app/app/models/Sandbag.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream BeforeSave decorator', () => {
  it('runs the query before creating a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id })
    const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })
    expect(compositionAsset.src).toEqual('default src')
  })

  it('runs the query before updating a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id })
    const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })
    compositionAsset.src = null
    await compositionAsset.save()
    expect(compositionAsset.src).toEqual('default src')
  })

  context('with ifChanging set on hook decorator', () => {
    let sandbag: Sandbag

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })
      sandbag = await mylar.createAssociation('sandbags', { weight: 10 })
    })

    context('one of the attributes specified in the "ifChanging" clause is changing', () => {
      it('calls hook', async () => {
        vi.spyOn(Sandbag.prototype, 'conditionalBeforeSaveHook')
        await sandbag.update({ weight: 11 })

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(Sandbag.prototype.conditionalBeforeSaveHook).toHaveBeenCalled()
      })
    })

    context('none of the attributes specified in the "ifChanging" clause are changing', () => {
      it('calls hook', async () => {
        await sandbag.update({ weight: null })
        vi.spyOn(Sandbag.prototype, 'conditionalBeforeSaveHook')
        await sandbag.update({ weightKgs: 120 })

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(Sandbag.prototype.conditionalBeforeSaveHook).not.toHaveBeenCalled()
      })
    })
  })
})
