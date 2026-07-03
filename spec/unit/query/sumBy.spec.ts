import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#sumBy', () => {
  let user: User
  let composition: Composition

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    composition = await Composition.create({ user })
  })

  it('groups the sum of the aggregated column by the group column, coercing each sum to a number', async () => {
    await CompositionAsset.create({ composition, name: 'primary', score: 3 })
    await CompositionAsset.create({ composition, name: 'primary', score: 7 })
    await CompositionAsset.create({ composition, name: 'secondary', score: 4 })

    const result = await CompositionAsset.query().sumBy('name', 'score')
    expect(result).toEqual(
      new Map<string | null, number | null>([
        ['primary', 10],
        ['secondary', 4],
      ])
    )
  })

  it('emits a real null key for records whose group column is null', async () => {
    await CompositionAsset.create({ composition, name: 'primary', score: 3 })
    await CompositionAsset.create({ composition, score: 8 })

    const result = await CompositionAsset.query().sumBy('name', 'score')
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

    const result = await CompositionAsset.query().sumBy('name', 'score')
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

      const result = await CompositionAsset.where({ name: 'primary' }).sumBy('name', 'score')
      expect(result).toEqual(new Map<string | null, number | null>([['primary', 10]]))
    })
  })

  context('with no matching records', () => {
    it('returns an empty Map', async () => {
      const result = await CompositionAsset.where({ name: 'nonexistent-name' }).sumBy('name', 'score')
      expect(result).toEqual(new Map())
    })
  })

  context('within an association query', () => {
    it('groups the sum for only the association records', async () => {
      await CompositionAsset.create({ composition, name: 'primary', score: 3 })
      await CompositionAsset.create({ composition, name: 'primary', score: 7 })
      await CompositionAsset.create({ composition, name: 'secondary', score: 4 })

      const otherComposition = await Composition.create({ user })
      await CompositionAsset.create({ composition: otherComposition, name: 'primary', score: 100 })

      const result = await composition.associationQuery('compositionAssets').sumBy('name', 'score')
      expect(result).toEqual(
        new Map<string | null, number | null>([
          ['primary', 10],
          ['secondary', 4],
        ])
      )
    })
  })

  context('on a join', () => {
    it('groups the sum by a joined association column', async () => {
      await CompositionAsset.create({ composition, name: 'primary', score: 3 })
      await CompositionAsset.create({ composition, name: 'primary', score: 7 })
      await CompositionAsset.create({ composition, name: 'secondary', score: 4 })

      const result = await Composition.query()
        .innerJoin('compositionAssets')
        .sumBy('compositionAssets.name', 'compositionAssets.score')
      expect(result).toEqual(
        new Map<string | null, number | null>([
          ['primary', 10],
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
          .sumBy('compositionAssets.name', 'compositionAssets.score')
        expect(result).toEqual(new Map<string | null, number | null>([['primary', 10]]))
      })
    })

    context('when passed a transaction', () => {
      it('reports accurate grouped sums (Query#txn path)', async () => {
        await CompositionAsset.create({ composition, name: 'primary', score: 3 })

        await ApplicationModel.transaction(async txn => {
          await CompositionAsset.txn(txn).create({ composition, name: 'primary', score: 7 })
          await CompositionAsset.txn(txn).create({ composition, name: 'secondary', score: 4 })

          const result = await CompositionAsset.query().txn(txn).sumBy('name', 'score')
          expect(result).toEqual(
            new Map<string | null, number | null>([
              ['primary', 10],
              ['secondary', 4],
            ])
          )
        })
      })
    })
  })
})
