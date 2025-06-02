import DreamDbConnection from '../../../src/db/DreamDbConnection.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import CompositionAssetAudit from '../../../test-app/app/models/CompositionAssetAudit.js'
import CatShape from '../../../test-app/app/models/Shape/Cat.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.preload', () => {
  it('loads a HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })
    await CompositionAssetAudit.create({
      compositionAssetId: compositionAsset.id,
    })

    const reloaded = await CompositionAssetAudit.preload('compositionAsset').first()
    expect(reloaded!.compositionAsset).toMatchDreamModel(compositionAsset)
  })

  it('supports where clauses', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user, content: 'hello' })
    const composition = await Composition.create({ user, content: 'goodbye' })

    const reloaded = await User.preload('compositions', { and: { content: 'goodbye' } }).first()
    expect(reloaded!.compositions).toMatchDreamModels([composition])
  })

  context('within a transaction', () => {
    it('loads a HasOne association', async () => {
      let reloadedCompositionAssetAudit: CompositionAssetAudit | null = null
      let compositionAsset: CompositionAsset | null = null
      await ApplicationModel.transaction(async txn => {
        const user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.txn(txn).create({ user })
        compositionAsset = await CompositionAsset.txn(txn).create({ composition })
        await CompositionAssetAudit.txn(txn).create({
          compositionAsset,
        })

        reloadedCompositionAssetAudit = await CompositionAssetAudit.txn(txn)
          .preload('compositionAsset')
          .first()
      })

      expect(reloadedCompositionAssetAudit!.compositionAsset).toMatchDreamModel(compositionAsset)
    })
  })

  context('STI associations are loaded', () => {
    it('correctly marshals each association to its respective dream class based on type', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })
      const latex = await Latex.create({ user, color: 'blue' })

      const users = await User.preload('balloons').all()
      expect(users[0]!.balloons).toMatchDreamModels([mylar, latex])
    })
  })

  it('supports overriding the connection', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user })

    const spy = vi.spyOn(DreamDbConnection, 'getConnection')

    await User.connection('replica').preload('compositions', 'compositionAssets').all()

    expect(spy).toHaveBeenCalledWith('replica')
    expect(spy).not.toHaveBeenCalledWith('primary')
  })

  it('supports overriding the connection when using a where clause', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })

    const spy = vi.spyOn(DreamDbConnection, 'getConnection')

    await User.connection('replica')
      .preload('compositions', { and: { id: composition.id } }, 'compositionAssets')
      .all()

    expect(spy).toHaveBeenCalledWith('replica')
    expect(spy).not.toHaveBeenCalledWith('primary')
  })

  context('STI with a polymorphic belongs_to association to another STI model', () => {
    it('loads the association', async () => {
      const shape = await CatShape.create()
      await Mylar.create({ shapable: shape })

      const clone = await Mylar.preload('shapable').first()
      expect(clone?.shapable).toMatchDreamModel(shape)
    })

    it('fails when the optional assoc is not there', async () => {
      await Mylar.create()
      const clone = await Mylar.preload('shapable').first()
      expect(clone?.shapable).toBeNull()
    })
  })
})
