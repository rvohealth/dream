import { DateTime } from 'luxon'
import Composition from '../../../../test-app/app/models/Composition'
import User from '../../../../test-app/app/models/User'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import Post from '../../../../test-app/app/models/Post'
import Rating from '../../../../test-app/app/models/Rating'

describe('Dream#query', () => {
  context('with a HasMany association', () => {
    it('returns a chainable query encapsulating that association', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const otherRecentComposition = await Composition.create({ user: otherUser })

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const recentComposition = await Composition.create({ user })
      const olderComposition = await Composition.create({
        user,
        created_at: DateTime.now().minus({ year: 1 }),
      })

      expect(await user.queryAssociation('recentCompositions').all()).toMatchDreamModels([recentComposition])
    })

    context('hasMany through', () => {
      it('returns a chainable query encapsulating that association', async () => {
        const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const otherRecentComposition = await Composition.create({ user: otherUser })

        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const recentComposition = await Composition.create({ user })
        const olderComposition = await Composition.create({
          user,
          created_at: DateTime.now().minus({ year: 1 }),
        })

        const compositionAsset1 = await CompositionAsset.create({ composition: recentComposition })
        const compositionAsset2 = await CompositionAsset.create({ composition: olderComposition })

        expect(await user.queryAssociation('recentCompositionAssets').all()).toMatchDreamModels([
          compositionAsset1,
        ])
      })
    })
  })
})
