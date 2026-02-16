import DreamDbConnection from '../../../src/db/DreamDbConnection.js'
import NonLoadedAssociation from '../../../src/errors/associations/NonLoadedAssociation.js'
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

  context('with an association provided as an argument to the and clause', () => {
    it('supports associations as clauses', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'fred2@frewd', password: 'howyadoin' })
      const composition1 = await Composition.create({ user: user1 })
      const composition2 = await Composition.create({ user: user2 })
      const compositionAsset1 = await CompositionAsset.create({ composition: composition1 })
      const compositionAsset2 = await CompositionAsset.create({ composition: composition2 })

      const compositionAssets = await CompositionAsset.query()
        .preload('composition', { and: { user: user2 } })
        .all()

      const reloadedCompositionAsset1 = compositionAssets.find(obj => obj.id === compositionAsset1.id)
      const reloadedCompositionAsset2 = compositionAssets.find(obj => obj.id === compositionAsset2.id)

      expect(reloadedCompositionAsset1?.composition).toBeNull()
      expect(reloadedCompositionAsset2?.composition).toMatchDreamModel(composition2)
    })
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

    expect(spy).toHaveBeenCalledWith('default', 'replica', expect.anything())
    expect(spy).not.toHaveBeenCalledWith('default', 'primary', expect.anything())
  })

  it('supports overriding the connection when using a where clause', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })

    const spy = vi.spyOn(DreamDbConnection, 'getConnection')

    await User.connection('replica')
      .preload('compositions', { and: { id: composition.id } }, 'compositionAssets')
      .all()

    expect(spy).toHaveBeenCalledWith('default', 'replica', expect.anything())
    expect(spy).not.toHaveBeenCalledWith('default', 'primary', expect.anything())
  })

  context('STI with a polymorphic belongs-to association to another STI model', () => {
    it('loads the association, leaving the polymorphic association type as the STI base class name', async () => {
      const shape = await CatShape.create()
      const mylar = await Mylar.create({ shapable: shape })
      expect(mylar?.shapableType).toEqual('Shape')

      const reloadedMylar = await Mylar.preload('shapable').firstOrFail()
      expect(reloadedMylar.shapable).toMatchDreamModel(shape)
      expect(reloadedMylar.shapableId).toEqual(shape.id)
      expect(reloadedMylar.shapableType).toEqual('Shape')
    })

    it('is null when the optional polymorphic assoc is not present', async () => {
      await Mylar.create()
      const reloadedMylar = await Mylar.preload('shapable').firstOrFail()
      expect(reloadedMylar.shapable).toBeNull()
    })

    it('throws an error when the assoc is not preloaded', async () => {
      await Mylar.create()
      const reloadedMylar = await Mylar.firstOrFail()
      expect(() => reloadedMylar.shapable).toThrow(NonLoadedAssociation)
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', () => {
    User
      // @ts-expect-error intentionally passing invalid arg to test that type protection is working
      .preload('invalid')

    User
      // @ts-expect-error intentionally passing invalid arg to test that type protection is working
      .preload('allPets', { and: { invalidArg: 123 } })
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(txn => {
        User.txn(txn)
          // @ts-expect-error intentionally passing invalid arg to test that type protection is working
          .preload('invalid')

        User.txn(txn).preload('allPets', {
          and: {
            // @ts-expect-error intentionally passing invalid arg to test that type protection is working
            invalidArg: 123,
          },
        })
      })
    })
  })
})
