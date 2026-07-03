import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#countBy', () => {
  it('groups the count by the provided column, coercing each count to a number', async () => {
    await Pet.create({ species: 'cat' })
    await Pet.create({ species: 'cat' })
    await Pet.create({ species: 'dog' })

    const result = await Pet.query().countBy('species')
    expect(result).toEqual(
      new Map<string | null, number>([
        ['cat', 2],
        ['dog', 1],
      ])
    )
  })

  it('emits a real null key for records whose group column is null', async () => {
    await Pet.create({ species: 'cat' })
    await Pet.create()
    await Pet.create()

    const result = await Pet.query().countBy('species')
    expect(result).toEqual(
      new Map<string | null, number>([
        ['cat', 1],
        [null, 2],
      ])
    )
  })

  it('produces map values that sum to the scalar count', async () => {
    await Pet.create({ species: 'cat' })
    await Pet.create({ species: 'dog' })
    await Pet.create()

    const grouped = await Pet.query().countBy('species')
    const total = [...grouped.values()].reduce((sum, value) => sum + value, 0)
    expect(total).toEqual(await Pet.count())
  })

  context('with a where clause', () => {
    it('respects the where clause', async () => {
      await Pet.create({ species: 'cat', name: 'Aster' })
      await Pet.create({ species: 'cat', name: 'Aster' })
      await Pet.create({ species: 'dog', name: 'Aster' })
      await Pet.create({ species: 'cat', name: 'Olive' })

      const result = await Pet.where({ name: 'Aster' }).countBy('species')
      expect(result).toEqual(
        new Map<string | null, number>([
          ['cat', 2],
          ['dog', 1],
        ])
      )
    })
  })

  context('with soft-deleted records', () => {
    it('excludes soft-deleted records (base scope carries through)', async () => {
      await Pet.create({ species: 'cat' })
      const deleted = await Pet.create({ species: 'cat' })
      await deleted.destroy()

      const result = await Pet.query().countBy('species')
      expect(result).toEqual(new Map<string | null, number>([['cat', 1]]))
    })
  })

  context('with no matching records', () => {
    it('returns an empty Map', async () => {
      const result = await Pet.where({ name: 'nonexistent-pet-name' }).countBy('species')
      expect(result).toEqual(new Map())
    })
  })

  context('within an association query', () => {
    it('groups the count for only the association records', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      await CompositionAsset.create({ composition, name: 'primary' })
      await CompositionAsset.create({ composition, name: 'primary' })
      await CompositionAsset.create({ composition, name: 'secondary' })

      // a different composition's assets must not be counted
      const otherComposition = await Composition.create({ user })
      await CompositionAsset.create({ composition: otherComposition, name: 'primary' })

      const result = await composition.associationQuery('compositionAssets').countBy('name')
      expect(result).toEqual(
        new Map<string | null, number>([
          ['primary', 2],
          ['secondary', 1],
        ])
      )
    })
  })

  context('on a join', () => {
    it('groups the count by a joined association column', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      await CompositionAsset.create({ composition, name: 'primary' })
      await CompositionAsset.create({ composition, name: 'primary' })
      await CompositionAsset.create({ composition, name: 'secondary' })

      const result = await Composition.query()
        .innerJoin('compositionAssets')
        .countBy('compositionAssets.name')
      expect(result).toEqual(
        new Map<string | null, number>([
          ['primary', 2],
          ['secondary', 1],
        ])
      )
    })

    context('when passed an association and clause', () => {
      it('respects the association and clause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        await CompositionAsset.create({ composition, name: 'primary' })
        await CompositionAsset.create({ composition, name: 'primary' })
        await CompositionAsset.create({ composition, name: 'secondary' })

        const result = await Composition.query()
          .innerJoin('compositionAssets', { and: { name: 'primary' } })
          .countBy('compositionAssets.name')
        expect(result).toEqual(new Map<string | null, number>([['primary', 2]]))
      })
    })

    context('when passed a transaction', () => {
      it('reports accurate grouped counts (Query#txn path)', async () => {
        await Pet.create({ species: 'cat' })

        await ApplicationModel.transaction(async txn => {
          await Pet.txn(txn).create({ species: 'cat' })
          await Pet.txn(txn).create({ species: 'dog' })

          const result = await Pet.query().txn(txn).countBy('species')
          expect(result).toEqual(
            new Map<string | null, number>([
              ['cat', 2],
              ['dog', 1],
            ])
          )
        })
      })
    })
  })
})
