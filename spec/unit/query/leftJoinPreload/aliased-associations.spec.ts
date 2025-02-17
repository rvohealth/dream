import { describe as context } from '@jest/globals'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import User from '../../../../test-app/app/models/User'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel'

describe('Query#leftJoinPreload with aliased associations', () => {
  it('handles conflicting aliases correctly when namespaced', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    const compositionAsset = await CompositionAsset.create({ composition, name: '1' })
    const otherCompositionAsset = await CompositionAsset.create({ composition, name: '2' })

    const reloaded = await User.query()
      .leftJoinPreload('compositionAssets')
      .leftJoinPreload('compositions as c1', 'compositionAssets as c2')
      .where({ 'c2.name': '2', 'compositionAssets.name': '1' })
      .firstOrFail()

    expect(reloaded.compositionAssets).toMatchDreamModel([compositionAsset])
    expect(reloaded.compositions[0].compositionAssets).toMatchDreamModels([otherCompositionAsset])
  })

  context('within a transaction', () => {
    it('handles conflicting aliases correctly when namespaced', async () => {
      let reloaded: User | undefined = undefined
      let compositionAsset: CompositionAsset
      let otherCompositionAsset: CompositionAsset

      await ApplicationModel.transaction(async txn => {
        const user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.txn(txn).create({ user })
        compositionAsset = await CompositionAsset.txn(txn).create({ composition, name: '1' })
        otherCompositionAsset = await CompositionAsset.txn(txn).create({ composition, name: '2' })

        reloaded = await User.txn(txn)
          .leftJoinPreload('compositionAssets')
          .leftJoinPreload('compositions as c1', 'compositionAssets as c2')
          .where({ 'c2.name': '2', 'compositionAssets.name': '1' })
          .firstOrFail()
      })

      expect(reloaded!.compositionAssets).toMatchDreamModel([compositionAsset!])
      expect(reloaded!.compositions[0].compositionAssets).toMatchDreamModels([otherCompositionAsset!])
    })
  })
})
