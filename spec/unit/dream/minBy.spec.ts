import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.minBy', () => {
  let composition: Composition

  beforeEach(async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    composition = await Composition.create({ user })
  })

  it('groups the min of the aggregated column across all records of a model', async () => {
    await CompositionAsset.create({ composition, name: 'primary', score: 3 })
    await CompositionAsset.create({ composition, name: 'primary', score: 7 })
    await CompositionAsset.create({ composition, name: 'secondary', score: 4 })
    await CompositionAsset.create({ composition, score: 8 })

    const result = await CompositionAsset.minBy('name', 'score')
    expect(result).toEqual(
      new Map<string | null, number | null>([
        ['primary', 3],
        ['secondary', 4],
        [null, 8],
      ])
    )
  })

  it('emits a null value for a group whose aggregated column is entirely null', async () => {
    await CompositionAsset.create({ composition, name: 'primary', score: 5 })
    await CompositionAsset.create({ composition, name: 'empty', score: null }, { skipHooks: true })

    const result = await CompositionAsset.minBy('name', 'score')
    expect(result).toEqual(
      new Map<string | null, number | null>([
        ['primary', 5],
        ['empty', null],
      ])
    )
  })

  context('with no records', () => {
    it('returns an empty Map', async () => {
      const result = await CompositionAsset.minBy('name', 'score')
      expect(result).toEqual(new Map())
    })
  })

  context('when passed a transaction', () => {
    it('reports accurate grouped mins (builder path)', async () => {
      await CompositionAsset.create({ composition, name: 'primary', score: 7 })

      await ApplicationModel.transaction(async txn => {
        await CompositionAsset.txn(txn).create({ composition, name: 'primary', score: 3 })
        await CompositionAsset.txn(txn).create({ composition, name: 'secondary', score: 4 })

        const result = await CompositionAsset.txn(txn).minBy('name', 'score')
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
