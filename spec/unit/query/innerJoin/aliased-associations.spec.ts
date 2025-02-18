import { describe as context } from '@jest/globals'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import User from '../../../../test-app/app/models/User'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel'

describe('Query#innerJoin with aliased associations', () => {
  it('handles conflicting aliases correctly when namespaced', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    await CompositionAsset.create({ composition, name: '1' })
    await CompositionAsset.create({ composition, name: '2' })

    const matching = await User.query()
      .innerJoin('compositionAssets')
      .innerJoin('compositions as c1', 'compositionAssets as c2')
      .where({ 'c2.name': '2', 'compositionAssets.name': '1' })
      .firstOrFail()
    expect(matching).toMatchDreamModel(user)

    const notMatching = await User.query()
      .innerJoin('compositionAssets')
      .innerJoin('compositions as c1', 'compositionAssets as c2')
      .where({ 'c2.name': '2', 'compositionAssets.name': 'not found' })
      .first()
    expect(notMatching).toBeNull()
  })

  context('within a transaction', () => {
    it('handles conflicting aliases correctly when namespaced', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      let matching: User | undefined = undefined
      let notMatching: User | null | undefined = undefined

      await ApplicationModel.transaction(async txn => {
        const composition = await Composition.txn(txn).create({ user })
        await CompositionAsset.txn(txn).create({ composition, name: '1' })
        await CompositionAsset.txn(txn).create({ composition, name: '2' })

        matching = await User.txn(txn)
          .innerJoin('compositionAssets')
          .innerJoin('compositions as c1', 'compositionAssets as c2')
          .where({ 'c2.name': '2', 'compositionAssets.name': '1' })
          .firstOrFail()

        notMatching = await User.txn(txn)
          .innerJoin('compositionAssets')
          .innerJoin('compositions as c1', 'compositionAssets as c2')
          .where({ 'c2.name': '2', 'compositionAssets.name': 'not found' })
          .first()
      })

      expect(matching).toMatchDreamModel(user)
      expect(notMatching).toBeNull()
    })
  })

  context('type tests', () => {
    it.skip('does not break when a single aliased argument is provided', () => {
      User.innerJoin('compositions as c')
      User.query().innerJoin('compositions as c')
      User.txn(undefined as any).innerJoin('compositions as c')
    })
  })
})
