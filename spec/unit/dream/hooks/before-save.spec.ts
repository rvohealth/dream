import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset.js'
import Sandbag from '../../../../test-app/app/models/Sandbag.js'
import User from '../../../../test-app/app/models/User.js'
import ValidationError from '../../../../src/errors/ValidationError.js'

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

  context('when the hook fills a value a validation requires', () => {
    it('saves the record, because before-save hooks run before validation', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id })
      vi.spyOn(CompositionAsset.prototype, 'ensureDefaultSrc').mockImplementation(function (
        this: CompositionAsset
      ) {
        this.compositionId = composition.id
      })

      const compositionAsset = CompositionAsset.new()
      await compositionAsset.save()

      const reloaded = await CompositionAsset.findOrFail(compositionAsset.id)
      expect(reloaded.compositionId).toEqual(composition.id)
    })

    it('rejects with a ValidationError when hooks are skipped', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id })
      vi.spyOn(CompositionAsset.prototype, 'ensureDefaultSrc').mockImplementation(function (
        this: CompositionAsset
      ) {
        this.compositionId = composition.id
      })

      const compositionAsset = CompositionAsset.new()
      await expect(compositionAsset.save({ skipHooks: true })).rejects.toThrow(ValidationError)
    })
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
        const spy = vi.spyOn(Sandbag.prototype, 'conditionalBeforeSaveHook')
        await sandbag.update({ weight: 11 })

        expect(spy).toHaveBeenCalled()
      })
    })

    context('none of the attributes specified in the "ifChanging" clause are changing', () => {
      it('calls hook', async () => {
        await sandbag.update({ weight: null })
        const spy = vi.spyOn(Sandbag.prototype, 'conditionalBeforeSaveHook')
        await sandbag.update({ weightKgs: 120 })

        expect(spy).not.toHaveBeenCalled()
      })
    })
  })
})
