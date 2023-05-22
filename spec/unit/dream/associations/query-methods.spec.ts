import { DateTime } from 'luxon'
import Composition from '../../../../test-app/app/models/Composition'
import User from '../../../../test-app/app/models/User'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'

describe('Dream#query', () => {
  context('with a HasMany association', () => {
    it('returns a chainable query encapsulating that association', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const recentComposition = await Composition.create({ user })
      const olderComposition = await Composition.create({
        user,
        created_at: DateTime.now().minus({ year: 1 }),
      })

      expect(await user.query('recentCompositions').all()).toMatchDreamModels([recentComposition])
    })

    context('hasMany through', () => {
      it('returns a chainable query encapsulating that association', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const recentComposition = await Composition.create({ user })
        const olderComposition = await Composition.create({
          user,
          created_at: DateTime.now().minus({ year: 1 }),
        })

        const compositionAsset1 = await CompositionAsset.create({ composition: recentComposition })
        const compositionAsset2 = await CompositionAsset.create({ composition: olderComposition })

        expect(await user.query('recentCompositionAssets').all()).toMatchDreamModels([compositionAsset1])
      })
    })
  })
})
