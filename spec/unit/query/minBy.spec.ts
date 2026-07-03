import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#minBy', () => {
  let user: User
  let composition: Composition

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    composition = await Composition.create({ user })
  })

  it('groups the min of the aggregated column by the group column', async () => {
    await CompositionAsset.create({ composition, name: 'primary', score: 3 })
    await CompositionAsset.create({ composition, name: 'primary', score: 7 })
    await CompositionAsset.create({ composition, name: 'secondary', score: 4 })

    const result = await CompositionAsset.query().minBy('name', 'score')
    expect(result).toEqual(
      new Map<string | null, number | null>([
        ['primary', 3],
        ['secondary', 4],
      ])
    )
  })

  it('emits a real null key for records whose group column is null', async () => {
    await CompositionAsset.create({ composition, name: 'primary', score: 3 })
    await CompositionAsset.create({ composition, score: 8 })

    const result = await CompositionAsset.query().minBy('name', 'score')
    expect(result).toEqual(
      new Map<string | null, number | null>([
        ['primary', 3],
        [null, 8],
      ])
    )
  })

  it('emits a null value for a group whose aggregated column is entirely null', async () => {
    await CompositionAsset.create({ composition, name: 'primary', score: 5 })
    await CompositionAsset.create({ composition, name: 'empty', score: null }, { skipHooks: true })
    await CompositionAsset.create({ composition, name: 'empty', score: null }, { skipHooks: true })

    const result = await CompositionAsset.query().minBy('name', 'score')
    expect(result).toEqual(
      new Map<string | null, number | null>([
        ['primary', 5],
        ['empty', null],
      ])
    )
  })

  context('with a where clause', () => {
    it('respects the where clause', async () => {
      await CompositionAsset.create({ composition, name: 'primary', score: 3 })
      await CompositionAsset.create({ composition, name: 'primary', score: 7 })
      await CompositionAsset.create({ composition, name: 'secondary', score: 4 })

      const result = await CompositionAsset.where({ name: 'primary' }).minBy('name', 'score')
      expect(result).toEqual(new Map<string | null, number | null>([['primary', 3]]))
    })
  })

  context('with no matching records', () => {
    it('returns an empty Map', async () => {
      const result = await CompositionAsset.where({ name: 'nonexistent-name' }).minBy('name', 'score')
      expect(result).toEqual(new Map())
    })
  })

  context('within an association query', () => {
    it('groups the min for only the association records', async () => {
      await CompositionAsset.create({ composition, name: 'primary', score: 3 })
      await CompositionAsset.create({ composition, name: 'primary', score: 7 })
      await CompositionAsset.create({ composition, name: 'secondary', score: 4 })

      const otherComposition = await Composition.create({ user })
      await CompositionAsset.create({ composition: otherComposition, name: 'primary', score: 1 })

      const result = await composition.associationQuery('compositionAssets').minBy('name', 'score')
      expect(result).toEqual(
        new Map<string | null, number | null>([
          ['primary', 3],
          ['secondary', 4],
        ])
      )
    })
  })

  context('on a join', () => {
    it('groups the min by a joined association column', async () => {
      await CompositionAsset.create({ composition, name: 'primary', score: 3 })
      await CompositionAsset.create({ composition, name: 'primary', score: 7 })
      await CompositionAsset.create({ composition, name: 'secondary', score: 4 })

      const result = await Composition.query()
        .innerJoin('compositionAssets')
        .minBy('compositionAssets.name', 'compositionAssets.score')
      expect(result).toEqual(
        new Map<string | null, number | null>([
          ['primary', 3],
          ['secondary', 4],
        ])
      )
    })

    context('when passed an association and clause', () => {
      it('respects the association and clause', async () => {
        await CompositionAsset.create({ composition, name: 'primary', score: 3 })
        await CompositionAsset.create({ composition, name: 'primary', score: 7 })
        await CompositionAsset.create({ composition, name: 'secondary', score: 4 })

        const result = await Composition.query()
          .innerJoin('compositionAssets', { and: { name: 'primary' } })
          .minBy('compositionAssets.name', 'compositionAssets.score')
        expect(result).toEqual(new Map<string | null, number | null>([['primary', 3]]))
      })
    })

    context('when passed a transaction', () => {
      it('reports accurate grouped mins (Query#txn path)', async () => {
        await CompositionAsset.create({ composition, name: 'primary', score: 7 })

        await ApplicationModel.transaction(async txn => {
          await CompositionAsset.txn(txn).create({ composition, name: 'primary', score: 3 })
          await CompositionAsset.txn(txn).create({ composition, name: 'secondary', score: 4 })

          const result = await CompositionAsset.query().txn(txn).minBy('name', 'score')
          expect(result).toEqual(
            new Map<string | null, number | null>([
              ['primary', 3],
              ['secondary', 4],
            ])
          )
        })
      })
    })
  })
})
